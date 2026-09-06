"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { recomputeEnrollmentProgress } from "@/lib/progress";
import { getOrCreateSession } from "@/lib/session-manager";

export type CompleteResult =
  | { ok: true; progressPct: number; courseCompleted: boolean; nextSlug: string | null }
  | { ok: false; error: string };

/**
 * Marks a chapter complete and recomputes the enrolment.
 *
 * The write and the recompute share one transaction so a course can never be
 * left with every chapter COMPLETED but the enrolment still ACTIVE. Completing
 * an already-complete chapter is a no-op, not an error — the button is allowed
 * to be clicked twice.
 */
export async function markChapterCompleteAction(
  chapterId: string,
): Promise<CompleteResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      order: true,
      courseId: true,
      course: {
        select: {
          slug: true,
          chapters: { orderBy: { order: "asc" }, select: { slug: true, order: true } },
        },
      },
    },
  });
  if (!chapter) return { ok: false, error: "Chapter not found." };

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: chapter.courseId } },
    select: { id: true },
  });
  if (!enrollment) return { ok: false, error: "You are not enrolled in this course." };

  const result = await db.$transaction(async (tx) => {
    await tx.chapterProgress.updateMany({
      where: {
        enrollmentId: enrollment.id,
        chapterId: chapter.id,
        status: { not: "COMPLETED" },
      },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return recomputeEnrollmentProgress(tx as never, enrollment.id);
  });

  const learningSessionId = await getOrCreateSession(user.id);
  await logEvent({
    userId: user.id,
    sessionId: learningSessionId,
    type: "CHAPTER_COMPLETE",
    courseId: chapter.courseId,
    chapterId: chapter.id,
  });

  if (result.justCompleted) {
    await logEvent({
      userId: user.id,
      sessionId: learningSessionId,
      type: "COURSE_COMPLETE",
      courseId: chapter.courseId,
    });
  }

  const next = chapter.course.chapters.find((c) => c.order === chapter.order + 1);

  revalidatePath(`/learn/${chapter.course.slug}`, "layout");
  revalidatePath(`/courses/${chapter.course.slug}`);
  revalidatePath("/dashboard");

  return {
    ok: true,
    progressPct: result.progressPct,
    courseCompleted: result.justCompleted,
    nextSlug: next?.slug ?? null,
  };
}
