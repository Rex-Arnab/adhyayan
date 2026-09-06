import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getOrCreateSession } from "@/lib/session-manager";

/**
 * Never trust a client-reported duration. A tab left open, a replayed request,
 * or a hand-crafted curl can all claim arbitrary time; clamping every beat to
 * one interval's worth of seconds is the entire anti-inflation story.
 */
export const MAX_DELTA_SECONDS = 20;

/** Two beats for the same chapter closer together than this are treated as a replay. */
export const MIN_BEAT_GAP_MS = 5_000;

export type TrackingContext = {
  userId: string;
  learningSessionId: string;
  courseId: string;
  chapterId: string;
  estimatedMinutes: number;
  progress: {
    id: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    activeSeconds: number;
    maxScrollPct: number;
    lastOpenedAt: Date | null;
    firstOpenedAt: Date | null;
  };
  enrollmentId: string;
};

/**
 * Resolves the caller to a ChapterProgress row they actually own.
 *
 * Returns null when unauthenticated, when the chapter does not exist, or when
 * the user has no enrolment for its course — a tracking endpoint must never
 * write time against a course the caller never enrolled in.
 */
export async function resolveTrackingContext(
  chapterId: string,
): Promise<TrackingContext | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, courseId: true, estimatedMinutes: true },
  });
  if (!chapter) return null;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: chapter.courseId } },
    select: { id: true },
  });
  if (!enrollment) return null;

  const progress = await db.chapterProgress.findUnique({
    where: {
      enrollmentId_chapterId: { enrollmentId: enrollment.id, chapterId: chapter.id },
    },
    select: {
      id: true,
      status: true,
      activeSeconds: true,
      maxScrollPct: true,
      lastOpenedAt: true,
      firstOpenedAt: true,
    },
  });
  if (!progress) return null;

  const learningSessionId = await getOrCreateSession(userId);

  return {
    userId,
    learningSessionId,
    courseId: chapter.courseId,
    chapterId: chapter.id,
    estimatedMinutes: chapter.estimatedMinutes,
    progress,
    enrollmentId: enrollment.id,
  };
}
