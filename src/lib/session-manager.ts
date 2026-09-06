import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";

/** A session with no heartbeat for this long is considered over. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;

/**
 * Returns the user's live LearningSession, opening one if needed.
 *
 * Stale sessions are closed lazily here rather than by a cron job — there is no
 * scheduler to deploy, and a session that is never read again does not matter.
 */
export async function getOrCreateSession(userId: string): Promise<string> {
  const open = await db.learningSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true, lastBeatAt: true },
  });

  if (open) {
    const idleMs = Date.now() - open.lastBeatAt.getTime();
    if (idleMs <= SESSION_IDLE_MS) return open.id;

    // Timed out. Close it at its last known activity, not at "now" — otherwise
    // every abandoned session inflates by the length of the user's absence.
    await db.learningSession.update({
      where: { id: open.id },
      data: { endedAt: open.lastBeatAt, endReason: "timeout" },
    });
    await logEvent({
      userId,
      sessionId: open.id,
      type: "SESSION_END",
      metadata: { endReason: "timeout" },
      occurredAt: open.lastBeatAt,
    });
  }

  const created = await db.learningSession.create({
    data: { userId },
    select: { id: true },
  });
  await logEvent({ userId, sessionId: created.id, type: "SESSION_START" });
  return created.id;
}

export async function endSession(
  userId: string,
  endReason: "logout" | "unload" | "timeout",
): Promise<void> {
  const open = await db.learningSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });
  if (!open) return;

  await db.learningSession.update({
    where: { id: open.id },
    data: { endedAt: new Date(), endReason },
  });
  await logEvent({
    userId,
    sessionId: open.id,
    type: "SESSION_END",
    metadata: { endReason },
  });
}
