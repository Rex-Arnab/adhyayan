import { db } from "@/lib/db";

export type LearnerStats = {
  totalActiveMinutes: number;
  chaptersCompleted: number;
  coursesCompleted: number;
  certificates: number;
  sessionCount: number;
  avgSessionMinutes: number;
  currentStreakDays: number;
  readingWpm: number | null;
};

/**
 * Every number on the dashboard comes from here, computed from the event and
 * progress tables. Nothing is hard-coded and nothing is estimated client-side.
 */
export async function getLearnerStats(userId: string): Promise<LearnerStats> {
  const [progressAgg, sessions, enrollments, certificates, speedRows] =
    await Promise.all([
      db.chapterProgress.aggregate({
        where: { enrollment: { userId } },
        _sum: { activeSeconds: true },
        _count: { _all: true },
      }),
      db.learningSession.findMany({
        where: { userId },
        select: { startedAt: true, activeSeconds: true },
        orderBy: { startedAt: "desc" },
      }),
      db.enrollment.findMany({
        where: { userId },
        select: { status: true },
      }),
      db.certificate.count({ where: { enrollment: { userId } } }),
      db.chapterProgress.findMany({
        where: { enrollment: { userId }, status: "COMPLETED", activeSeconds: { gt: 0 } },
        select: { activeSeconds: true, chapter: { select: { wordCount: true } } },
      }),
    ]);

  const completed = await db.chapterProgress.count({
    where: { enrollment: { userId }, status: "COMPLETED" },
  });

  const totalSeconds = progressAgg._sum.activeSeconds ?? 0;
  const sessionSeconds = sessions.reduce((s, x) => s + x.activeSeconds, 0);

  // Reading speed across completed chapters only — a half-read chapter would
  // divide a full word count by partial time and report a wild wpm.
  const words = speedRows.reduce((s, r) => s + r.chapter.wordCount, 0);
  const secs = speedRows.reduce((s, r) => s + r.activeSeconds, 0);

  return {
    totalActiveMinutes: Math.round(totalSeconds / 60),
    chaptersCompleted: completed,
    coursesCompleted: enrollments.filter((e) => e.status === "COMPLETED").length,
    certificates,
    sessionCount: sessions.length,
    avgSessionMinutes:
      sessions.length === 0 ? 0 : Math.round(sessionSeconds / sessions.length / 60),
    currentStreakDays: streakFrom(sessions.map((s) => s.startedAt)),
    readingWpm: secs > 0 ? Math.round((words / secs) * 60) : null,
  };
}

/**
 * Consecutive days ending today or yesterday. Yesterday still counts so a
 * learner who has not studied *yet today* does not see their streak zeroed.
 */
export function streakFrom(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const days = new Set(
    dates.map((d) => {
      const c = new Date(d);
      c.setHours(0, 0, 0, 0);
      return c.getTime();
    }),
  );

  const DAY = 86_400_000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = today.getTime();
  if (!days.has(cursor)) {
    cursor -= DAY;
    if (!days.has(cursor)) return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}
