import { db } from "@/lib/db";
import { BASELINE_WPM } from "@/lib/reading";

export type LearnerProfile = {
  userId: string;
  totalActiveMinutes: number;
  sessionCount: number;
  avgSessionMinutes: number;
  avgChaptersPerSession: number;
  readingSpeedWpm: number;
  completionRate: number;
  /** Normalised 0-1, weighted by active time spent on courses carrying each tag. */
  tagAffinity: Record<string, number>;
  currentStreakDays: number;
  inProgress: {
    courseId: string;
    courseSlug: string;
    courseTitle: string;
    nextChapterId: string | null;
    nextChapterSlug: string | null;
    progressPct: number;
  }[];
  completedCourseIds: string[];
  enrolledCourseIds: string[];
  abandoned: { courseId: string; courseTitle: string; daysSinceTouch: number }[];
};

const ABANDON_DAYS = 7;

/**
 * The single source of truth about a learner for recommendation purposes.
 * Nothing else in the reco pipeline may query raw events — if a signal is
 * needed, it gets added here so the heuristic and the ML model see the same
 * inputs.
 */
export async function buildLearnerProfile(userId: string): Promise<LearnerProfile> {
  const [enrollments, sessions] = await Promise.all([
    db.enrollment.findMany({
      where: { userId },
      select: {
        courseId: true,
        status: true,
        progressPct: true,
        lastSeenAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            tags: true,
            chapters: {
              orderBy: { order: "asc" },
              select: { id: true, slug: true, wordCount: true },
            },
          },
        },
        chapters: {
          select: { chapterId: true, status: true, activeSeconds: true },
        },
      },
    }),
    db.learningSession.findMany({
      where: { userId },
      select: { startedAt: true, activeSeconds: true, chaptersVisited: true },
    }),
  ]);

  const tagSeconds: Record<string, number> = {};
  let totalSeconds = 0;
  let words = 0;
  let readSeconds = 0;

  const inProgress: LearnerProfile["inProgress"] = [];
  const abandoned: LearnerProfile["abandoned"] = [];
  const completedCourseIds: string[] = [];

  const now = Date.now();

  for (const e of enrollments) {
    const seconds = e.chapters.reduce((s, c) => s + c.activeSeconds, 0);
    totalSeconds += seconds;

    for (const tag of e.course.tags) {
      tagSeconds[tag] = (tagSeconds[tag] ?? 0) + seconds;
    }

    const doneIds = new Set(
      e.chapters.filter((c) => c.status === "COMPLETED").map((c) => c.chapterId),
    );

    for (const c of e.chapters) {
      if (c.status === "COMPLETED" && c.activeSeconds > 0) {
        const ch = e.course.chapters.find((x) => x.id === c.chapterId);
        if (ch) {
          words += ch.wordCount;
          readSeconds += c.activeSeconds;
        }
      }
    }

    if (e.status === "COMPLETED") {
      completedCourseIds.push(e.courseId);
      continue;
    }

    const next = e.course.chapters.find((ch) => !doneIds.has(ch.id)) ?? null;
    const daysSinceTouch = Math.floor((now - e.lastSeenAt.getTime()) / 86_400_000);

    inProgress.push({
      courseId: e.courseId,
      courseSlug: e.course.slug,
      courseTitle: e.course.title,
      nextChapterId: next?.id ?? null,
      nextChapterSlug: next?.slug ?? null,
      progressPct: e.progressPct,
    });

    if (daysSinceTouch >= ABANDON_DAYS) {
      abandoned.push({
        courseId: e.courseId,
        courseTitle: e.course.title,
        daysSinceTouch,
      });
    }
  }

  const maxTag = Math.max(1, ...Object.values(tagSeconds));
  const tagAffinity = Object.fromEntries(
    Object.entries(tagSeconds).map(([tag, s]) => [tag, s / maxTag]),
  );

  const sessionSeconds = sessions.reduce((s, x) => s + x.activeSeconds, 0);
  const visited = sessions.reduce((s, x) => s + x.chaptersVisited, 0);

  return {
    userId,
    totalActiveMinutes: Math.round(totalSeconds / 60),
    sessionCount: sessions.length,
    avgSessionMinutes:
      sessions.length === 0 ? 0 : Math.round(sessionSeconds / sessions.length / 60),
    avgChaptersPerSession:
      sessions.length === 0
        ? 0
        : Math.round((visited / sessions.length) * 10) / 10,
    readingSpeedWpm:
      readSeconds > 0 ? Math.round((words / readSeconds) * 60) : BASELINE_WPM,
    completionRate:
      enrollments.length === 0
        ? 0
        : completedCourseIds.length / enrollments.length,
    tagAffinity,
    currentStreakDays: 0, // filled by the dashboard from getLearnerStats
    inProgress,
    completedCourseIds,
    enrolledCourseIds: enrollments.map((e) => e.courseId),
    abandoned,
  };
}
