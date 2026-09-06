import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

import type { PrismaClient } from "../../src/generated/prisma/client";
import { COURSES } from "./catalog";

export const SNAPSHOT_FILE = join(
  process.cwd(),
  "prisma",
  "fixtures",
  "snapshot.json.gz",
);

export function snapshotExists(): boolean {
  return existsSync(SNAPSHOT_FILE);
}

type Row = Record<string, unknown>;

/** Every column across the fixture that holds a timestamp. */
const DATE_FIELDS = new Set([
  "createdAt", "enrolledAt", "lastSeenAt", "completedAt", "startedAt",
  "lastBeatAt", "endedAt", "firstOpenedAt", "lastOpenedAt", "occurredAt",
  "issuedAt", "generatedAt", "shownAt", "clickedAt", "computedAt",
]);

/**
 * Shifts every timestamp forward by however long ago the snapshot was taken.
 *
 * Without this, a fixture committed weeks ago restores a database whose most
 * recent activity is weeks old: empty streaks, an empty events-per-day chart and
 * a dashboard that looks broken. Relative spacing is preserved exactly.
 */
function rebase(rows: Row[], offsetMs: number): Row[] {
  return rows.map((row) => {
    const out: Row = { ...row };
    for (const key of Object.keys(out)) {
      if (!DATE_FIELDS.has(key)) continue;
      const value = out[key];
      if (typeof value === "string") {
        out[key] = new Date(new Date(value).getTime() + offsetMs);
      }
    }
    return out;
  });
}

/** Chapter markdown is not in the fixture — it is read back from prisma/content. */
function readChapterMarkdown(courseSlug: string, order: number, slug: string): string {
  const course = COURSES.find((c) => c.slug === courseSlug);
  if (!course) throw new Error(`No catalogue entry for course "${courseSlug}"`);
  const file = join(
    process.cwd(), "prisma", "content", course.dir,
    `${String(order).padStart(2, "0")}-${slug}.md`,
  );
  if (!existsSync(file)) {
    throw new Error(`Snapshot references missing chapter file: ${file}`);
  }
  return readFileSync(file, "utf8").trim();
}

async function chunked(
  rows: Row[],
  size: number,
  insert: (batch: Row[]) => Promise<unknown>,
) {
  for (let i = 0; i < rows.length; i += size) {
    await insert(rows.slice(i, i + size));
  }
}

/**
 * Restores an exact snapshot of a previous database, including the ML-generated
 * recommendations and learner profiles — so a fresh `docker compose up` yields a
 * fully populated platform without needing to run the Python pipeline first.
 */
export async function restoreSnapshot(db: PrismaClient) {
  const raw = JSON.parse(gunzipSync(readFileSync(SNAPSHOT_FILE)).toString("utf8"));

  const offsetMs = Math.max(0, Date.now() - new Date(raw.exportedAt).getTime());
  const days = Math.round(offsetMs / 86_400_000);
  console.log(
    `Restoring snapshot v${raw.version} taken ${raw.exportedAt}` +
      (days > 0 ? ` (shifting timestamps forward ${days} day(s))` : ""),
  );

  const courseSlugById = new Map<string, string>(
    (raw.courses as Row[]).map((c) => [c.id as string, c.slug as string]),
  );

  // FK order: users -> courses -> chapters -> enrolments -> progress ->
  // sessions -> events -> certificates -> recommendations -> profiles.
  await db.user.createMany({ data: rebase(raw.users, offsetMs) as never });
  await db.course.createMany({ data: rebase(raw.courses, offsetMs) as never });

  await db.chapter.createMany({
    data: (raw.chapters as Row[]).map((ch) => ({
      ...ch,
      contentMd: readChapterMarkdown(
        courseSlugById.get(ch.courseId as string)!,
        ch.order as number,
        ch.slug as string,
      ),
    })) as never,
  });

  await db.enrollment.createMany({ data: rebase(raw.enrollments, offsetMs) as never });
  await chunked(rebase(raw.chapterProgress, offsetMs), 2000, (b) =>
    db.chapterProgress.createMany({ data: b as never }),
  );
  await db.learningSession.createMany({ data: rebase(raw.sessions, offsetMs) as never });
  await chunked(rebase(raw.events, offsetMs), 2000, (b) =>
    db.eventLog.createMany({ data: b as never }),
  );
  await db.certificate.createMany({ data: rebase(raw.certificates, offsetMs) as never });
  await db.recommendation.createMany({ data: rebase(raw.recommendations, offsetMs) as never });
  await db.mlProfile.createMany({ data: rebase(raw.mlProfiles, offsetMs) as never });

  return raw.counts as Record<string, number>;
}
