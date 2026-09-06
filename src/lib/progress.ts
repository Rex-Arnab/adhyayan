import { db } from "@/lib/db";

/**
 * Auto-completion thresholds. The explicit "Mark complete" button is always the
 * primary path — these exist only to catch a learner who reads to the end and
 * then closes the tab without clicking. Progression is NEVER blocked on them.
 */
export const AUTO_COMPLETE_SCROLL_PCT = 90;
export const AUTO_COMPLETE_TIME_RATIO = 0.4;

export function qualifiesForAutoComplete(
  maxScrollPct: number,
  activeSeconds: number,
  estimatedMinutes: number,
): boolean {
  const required = AUTO_COMPLETE_TIME_RATIO * estimatedMinutes * 60;
  return maxScrollPct >= AUTO_COMPLETE_SCROLL_PCT && activeSeconds >= required;
}

/**
 * Recomputes an enrolment's percentage from its chapter rows and flips the
 * enrolment to COMPLETED when every chapter is done.
 *
 * Returns whether this call is the one that completed the course, so the caller
 * can issue the certificate exactly once. Runs inside the caller's transaction
 * where one is supplied.
 */
export async function recomputeEnrollmentProgress(
  tx: Pick<typeof db, "chapterProgress" | "enrollment">,
  enrollmentId: string,
): Promise<{ progressPct: number; justCompleted: boolean }> {
  const rows = await tx.chapterProgress.findMany({
    where: { enrollmentId },
    select: { status: true },
  });

  const total = rows.length;
  const done = rows.filter((r) => r.status === "COMPLETED").length;
  const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);

  const enrollment = await tx.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { status: true },
  });

  const allDone = total > 0 && done === total;
  const justCompleted = allDone && enrollment?.status !== "COMPLETED";

  await tx.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPct,
      lastSeenAt: new Date(),
      ...(justCompleted
        ? { status: "COMPLETED" as const, completedAt: new Date() }
        : {}),
    },
  });

  return { progressPct, justCompleted };
}

export type LearnChapter = {
  id: string;
  order: number;
  slug: string;
  title: string;
  estimatedMinutes: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  activeSeconds: number;
};

/**
 * Everything the learn page needs, in one round trip per entity.
 * Returns null when the course, chapter, or enrolment is missing — the caller
 * decides between notFound() and a redirect.
 */
export async function getLearnContext(
  userId: string,
  courseSlug: string,
  chapterSlug: string,
) {
  const course = await db.course.findUnique({
    where: { slug: courseSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      chapters: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          slug: true,
          title: true,
          contentMd: true,
          youtubeId: true,
          wordCount: true,
          estimatedMinutes: true,
        },
      },
    },
  });
  if (!course || !course.published) return null;

  const index = course.chapters.findIndex((c) => c.slug === chapterSlug);
  if (index === -1) return null;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: {
      id: true,
      status: true,
      progressPct: true,
      chapters: {
        select: {
          chapterId: true,
          status: true,
          activeSeconds: true,
          maxScrollPct: true,
        },
      },
    },
  });

  const byChapter = new Map(enrollment?.chapters.map((c) => [c.chapterId, c]) ?? []);

  const chapters: LearnChapter[] = course.chapters.map((c) => {
    const p = byChapter.get(c.id);
    return {
      id: c.id,
      order: c.order,
      slug: c.slug,
      title: c.title,
      estimatedMinutes: c.estimatedMinutes,
      status: p?.status ?? "NOT_STARTED",
      activeSeconds: p?.activeSeconds ?? 0,
    };
  });

  const current = course.chapters[index];
  const completedCount = chapters.filter((c) => c.status === "COMPLETED").length;

  return {
    course: { id: course.id, slug: course.slug, title: course.title },
    enrollment,
    chapters,
    chapter: current,
    currentProgress: byChapter.get(current.id) ?? null,
    previous: index > 0 ? course.chapters[index - 1] : null,
    next: index < course.chapters.length - 1 ? course.chapters[index + 1] : null,
    completedCount,
    progressPct:
      chapters.length === 0
        ? 0
        : Math.round((completedCount / chapters.length) * 100),
  };
}
