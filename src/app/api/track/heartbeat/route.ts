import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import {
  qualifiesForAutoComplete,
  recomputeEnrollmentProgress,
} from "@/lib/progress";
import {
  MAX_DELTA_SECONDS,
  MIN_BEAT_GAP_MS,
  resolveTrackingContext,
} from "@/lib/tracking";

export const runtime = "nodejs";

const Body = z.object({
  chapterId: z.string(),
  deltaSeconds: z.number().min(0).max(600),
  scrollPct: z.number().min(0).max(100),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const ctx = await resolveTrackingContext(parsed.data.chapterId);
  if (!ctx) return NextResponse.json({ error: "Not permitted" }, { status: 403 });

  // Replay guard: a beat arriving sooner than the minimum gap is discarded.
  // Answer 200 anyway — the client did nothing wrong and must not retry.
  const sinceLastBeat = Date.now() - (ctx.progress.lastOpenedAt?.getTime() ?? 0);
  if (sinceLastBeat < MIN_BEAT_GAP_MS) {
    return NextResponse.json({ ok: true, ignored: "too_soon" });
  }

  const delta = Math.min(parsed.data.deltaSeconds, MAX_DELTA_SECONDS);
  const scrollPct = Math.max(ctx.progress.maxScrollPct, parsed.data.scrollPct);
  const activeSeconds = ctx.progress.activeSeconds + delta;

  // Safety net only: the explicit button is the primary path, and this never
  // blocks or forces progression — it just catches a reader who closes the tab.
  const autoComplete =
    ctx.progress.status !== "COMPLETED" &&
    qualifiesForAutoComplete(scrollPct, activeSeconds, ctx.estimatedMinutes);

  await db.$transaction([
    db.chapterProgress.update({
      where: { id: ctx.progress.id },
      data: {
        activeSeconds: { increment: delta },
        maxScrollPct: scrollPct,
        lastOpenedAt: new Date(),
        ...(autoComplete
          ? { status: "COMPLETED" as const, completedAt: new Date() }
          : ctx.progress.status === "NOT_STARTED"
            ? { status: "IN_PROGRESS" as const }
            : {}),
      },
    }),
    db.learningSession.update({
      where: { id: ctx.learningSessionId },
      data: { activeSeconds: { increment: delta }, lastBeatAt: new Date() },
    }),
    db.eventLog.create({
      data: {
        userId: ctx.userId,
        sessionId: ctx.learningSessionId,
        type: "CHAPTER_HEARTBEAT",
        courseId: ctx.courseId,
        chapterId: ctx.chapterId,
        metadata: { delta, scrollPct } as never,
        occurredAt: new Date(),
      },
    }),
  ]);

  if (autoComplete) {
    await logEvent({
      userId: ctx.userId,
      sessionId: ctx.learningSessionId,
      type: "CHAPTER_COMPLETE",
      courseId: ctx.courseId,
      chapterId: ctx.chapterId,
      metadata: { via: "auto", activeSeconds, scrollPct },
    });
    const result = await recomputeEnrollmentProgress(db, ctx.enrollmentId);
    if (result.justCompleted) {
      await logEvent({
        userId: ctx.userId,
        sessionId: ctx.learningSessionId,
        type: "COURSE_COMPLETE",
        courseId: ctx.courseId,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    activeSeconds,
    maxScrollPct: scrollPct,
    autoCompleted: autoComplete,
  });
}
