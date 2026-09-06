"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { getOrCreateSession } from "@/lib/session-manager";

export type EnrollResult =
  | { ok: true; courseSlug: string; firstChapterSlug: string }
  | { ok: false; error: string };

/**
 * Enrols the current user and materialises a ChapterProgress row for every
 * chapter in ONE transaction. Anything less leaves an enrolment whose progress
 * rows are missing, which every downstream progress calculation then divides by.
 */
export async function enrollAction(courseId: string): Promise<EnrollResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const userId = user.id;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      slug: true,
      published: true,
      chapters: { select: { id: true, slug: true }, orderBy: { order: "asc" } },
    },
  });

  if (!course || !course.published) return { ok: false, error: "Course not found." };
  if (course.chapters.length === 0) {
    return { ok: false, error: "This course has no chapters yet." };
  }

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true },
  });

  if (!existing) {
    try {
      await db.$transaction(async (tx) => {
        const enrollment = await tx.enrollment.create({
          data: { userId, courseId: course.id },
          select: { id: true },
        });
        await tx.chapterProgress.createMany({
          data: course.chapters.map((chapter) => ({
            enrollmentId: enrollment.id,
            chapterId: chapter.id,
          })),
        });
      });
    } catch {
      // Unique constraint => a concurrent double-click already enrolled them.
      // That is a success from the learner's point of view, not an error.
      const raced = await db.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
        select: { id: true },
      });
      if (!raced) return { ok: false, error: "Could not enrol. Please try again." };
    }

    const learningSessionId = await getOrCreateSession(userId);
    await logEvent({
      userId,
      sessionId: learningSessionId,
      type: "COURSE_ENROLL",
      courseId: course.id,
    });
  }

  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/dashboard");

  return {
    ok: true,
    courseSlug: course.slug,
    firstChapterSlug: course.chapters[0].slug,
  };
}
