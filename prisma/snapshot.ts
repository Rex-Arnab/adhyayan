import "dotenv/config";
import { gzipSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { db } from "../src/lib/db";

/**
 * Exports the live database to a fixture the seed can restore verbatim.
 *
 * Chapter markdown is deliberately EXCLUDED: it already lives in
 * prisma/content/*.md, which stays the single source of truth. Duplicating it
 * here would double the fixture size and let the two copies drift.
 *
 * Run:  npm run db:snapshot
 */
const OUT_DIR = join(process.cwd(), "prisma", "fixtures");
const OUT_FILE = join(OUT_DIR, "snapshot.json.gz");

async function main() {
  const [
    users, courses, chapters, enrollments, chapterProgress,
    sessions, events, certificates, recommendations, mlProfiles,
  ] = await Promise.all([
    db.user.findMany({ orderBy: { id: "asc" } }),
    db.course.findMany({ orderBy: { createdAt: "asc" } }),
    db.chapter.findMany({
      orderBy: [{ courseId: "asc" }, { order: "asc" }],
      // contentMd omitted on purpose — rehydrated from prisma/content at restore.
      select: {
        id: true, courseId: true, order: true, slug: true, title: true,
        youtubeId: true, wordCount: true, estimatedMinutes: true,
      },
    }),
    db.enrollment.findMany({ orderBy: { id: "asc" } }),
    db.chapterProgress.findMany({ orderBy: { id: "asc" } }),
    db.learningSession.findMany({ orderBy: { id: "asc" } }),
    db.eventLog.findMany({ orderBy: { createdAt: "asc" } }),
    db.certificate.findMany({ orderBy: { issuedAt: "asc" } }),
    db.recommendation.findMany({ orderBy: { generatedAt: "asc" } }),
    db.mlProfile.findMany({ orderBy: { userId: "asc" } }),
  ]);

  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    // Timestamps are stored absolutely. The seed re-bases them on restore so a
    // months-old fixture does not present an empty "recent activity" dashboard.
    counts: {
      users: users.length, courses: courses.length, chapters: chapters.length,
      enrollments: enrollments.length, chapterProgress: chapterProgress.length,
      sessions: sessions.length, events: events.length,
      certificates: certificates.length, recommendations: recommendations.length,
      mlProfiles: mlProfiles.length,
    },
    users, courses, chapters, enrollments, chapterProgress,
    sessions, events, certificates, recommendations, mlProfiles,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(snapshot);
  const gz = gzipSync(Buffer.from(json), { level: 9 });
  writeFileSync(OUT_FILE, gz);

  console.table(snapshot.counts);
  console.log(
    `\nsnapshot -> prisma/fixtures/snapshot.json.gz  ` +
      `(${(json.length / 1e6).toFixed(2)} MB raw -> ${(gz.length / 1e6).toFixed(2)} MB gzipped)`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
