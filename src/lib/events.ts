import { db } from "@/lib/db";

/**
 * The complete event taxonomy. Adding a new event means adding it here first —
 * `EventType` is what keeps the ML feature extractor and the app in agreement.
 */
export const EVENT_TYPES = [
  "AUTH_REGISTER",
  "AUTH_LOGIN",
  "AUTH_LOGOUT",
  "SESSION_START",
  "SESSION_END",
  "CATALOG_VIEW",
  "COURSE_VIEW",
  "COURSE_ENROLL",
  "COURSE_COMPLETE",
  "CHAPTER_OPEN",
  "CHAPTER_HEARTBEAT",
  "CHAPTER_SCROLL",
  "CHAPTER_COMPLETE",
  "CHAPTER_NEXT",
  "CHAPTER_PREV",
  "CHAPTER_EXIT",
  "IDLE_START",
  "IDLE_END",
  "TAB_HIDDEN",
  "TAB_VISIBLE",
  "CERTIFICATE_ISSUE",
  "CERTIFICATE_DOWNLOAD",
  "SEARCH",
  "RECOMMENDATION_SHOWN",
  "RECOMMENDATION_CLICK",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type LogEventInput = {
  type: EventType;
  userId?: string | null;
  sessionId?: string | null;
  courseId?: string | null;
  chapterId?: string | null;
  metadata?: Record<string, unknown>;
  /** Client-reported time. May be skewed; `createdAt` is the source of truth. */
  occurredAt?: Date;
};

/**
 * Fire-and-forget event write. Instrumentation must never be able to fail a
 * user-facing request, so this swallows its own errors by design.
 */
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    await db.eventLog.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        courseId: input.courseId ?? null,
        chapterId: input.chapterId ?? null,
        metadata: (input.metadata ?? {}) as never,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  } catch (error) {
    console.error("[events] failed to log", input.type, error);
  }
}
