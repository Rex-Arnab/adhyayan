import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { db } from "@/lib/db";

export type Funnel = { stage: string; users: number }[];
export type CtrRow = { key: string; shown: number; clicked: number; ctr: number };
export type EventsPerDay = { date: string; type: string; count: number }[];

export type ModelMetrics = {
  generated_at: string;
  best_model: string;
  split: { train_rows: number; test_rows: number; test_positive_rate: number; cutoff: string };
  metrics: Record<string, { auc: number; precision_at_3: number; recall_at_3: number; ndcg_at_3: number }>;
  feature_importances: { feature: string; weight: number }[];
  collab: { available: boolean; explained_variance: number };
} | null;

/**
 * Reads the Python pipeline's metrics artifact.
 *
 * Returns null when the model has never run — the page must render without it
 * rather than error, which is the same contract the recommendations follow.
 */
export async function readModelMetrics(): Promise<ModelMetrics> {
  try {
    const raw = await readFile(
      join(process.cwd(), "ml", "artifacts", "metrics.json"),
      "utf8",
    );
    return JSON.parse(raw) as ModelMetrics;
  } catch {
    return null;
  }
}

export async function getFunnel(): Promise<Funnel> {
  const [registered, enrolled, readOne, completedCourse] = await Promise.all([
    db.user.count(),
    db.enrollment
      .findMany({ select: { userId: true }, distinct: ["userId"] })
      .then((r) => r.length),
    db.chapterProgress
      .findMany({
        where: { status: "COMPLETED" },
        select: { enrollment: { select: { userId: true } } },
      })
      .then((r) => new Set(r.map((x) => x.enrollment.userId)).size),
    db.enrollment
      .findMany({
        where: { status: "COMPLETED" },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then((r) => r.length),
  ]);

  return [
    { stage: "Registered", users: registered },
    { stage: "Enrolled", users: enrolled },
    { stage: "Read a chapter", users: readOne },
    { stage: "Completed a course", users: completedCourse },
  ];
}

async function ctrGroupedBy(field: "source" | "variant"): Promise<CtrRow[]> {
  const rows = await db.recommendation.groupBy({
    by: [field],
    _count: { _all: true },
  });

  const out: CtrRow[] = [];
  for (const row of rows) {
    const key = (row[field] as string | null) ?? "unknown";
    const [shown, clicked] = await Promise.all([
      db.recommendation.count({ where: { [field]: row[field], shownAt: { not: null } } }),
      db.recommendation.count({ where: { [field]: row[field], clickedAt: { not: null } } }),
    ]);
    out.push({
      key,
      shown,
      clicked,
      // Guard the divide: an arm that has never been shown has no CTR, not 0%.
      ctr: shown === 0 ? 0 : Math.round((clicked / shown) * 1000) / 10,
    });
  }
  return out.sort((a, b) => b.shown - a.shown);
}

export const getCtrBySource = () => ctrGroupedBy("source");
export const getCtrByVariant = () => ctrGroupedBy("variant");

export async function getEventsPerDay(days = 14): Promise<EventsPerDay> {
  const rows = await db.$queryRaw<{ day: Date; type: string; count: bigint }[]>`
    select date_trunc('day', "createdAt") as day, type, count(*) as count
    from "EventLog"
    where "createdAt" > now() - make_interval(days => ${days})
    group by 1, 2
    order by 1 asc
  `;
  return rows.map((r) => ({
    date: r.day.toISOString().slice(0, 10),
    type: r.type,
    count: Number(r.count),
  }));
}

export async function getChapterEngagement() {
  const rows = await db.$queryRaw<
    { title: string; course: string; avg_minutes: number; readers: bigint }[]
  >`
    select ch.title            as title,
           c.title             as course,
           avg(cp."activeSeconds") / 60.0 as avg_minutes,
           count(*)            as readers
    from "ChapterProgress" cp
    join "Chapter" ch on ch.id = cp."chapterId"
    join "Course" c on c.id = ch."courseId"
    where cp."activeSeconds" > 0
    group by ch.title, c.title
    order by avg_minutes desc
    limit 12
  `;
  return rows.map((r) => ({
    title: r.title,
    course: r.course,
    avgMinutes: Math.round(Number(r.avg_minutes) * 10) / 10,
    readers: Number(r.readers),
  }));
}

export async function getPersonaBreakdown() {
  const rows = await db.mlProfile.groupBy({
    by: ["persona"],
    _count: { _all: true },
    _avg: { dropoutRisk: true, readingWpm: true },
  });
  return rows
    .map((r) => ({
      persona: r.persona ?? "unclassified",
      learners: r._count._all,
      avgDropoutRisk: Math.round((r._avg.dropoutRisk ?? 0) * 1000) / 1000,
      avgWpm: Math.round(r._avg.readingWpm ?? 0),
    }))
    .sort((a, b) => b.learners - a.learners);
}

export async function getSessionDistribution() {
  const rows = await db.learningSession.findMany({
    where: { chaptersVisited: { gt: 0 } },
    select: { chaptersVisited: true },
  });
  const buckets = new Map<number, number>();
  for (const r of rows) {
    const k = Math.min(r.chaptersVisited, 8);
    buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([chapters, sessions]) => ({
      label: chapters >= 8 ? "8+" : String(chapters),
      sessions,
    }));
}
