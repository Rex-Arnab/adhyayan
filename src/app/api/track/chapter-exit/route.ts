import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { MAX_DELTA_SECONDS, resolveTrackingContext } from "@/lib/tracking";

export const runtime = "nodejs";

const Body = z.object({
  chapterId: z.string(),
  deltaSeconds: z.number().min(0).max(600),
  scrollPct: z.number().min(0).max(100),
});

/**
 * sendBeacon target. Fires during page teardown, so it must be cheap and must
 * never depend on the response — nothing is listening by the time it returns.
 *
 * No replay guard here: this is the final partial segment, and dropping it is
 * exactly the silent data loss the beacon exists to prevent.
 */
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

  const delta = Math.min(parsed.data.deltaSeconds, MAX_DELTA_SECONDS);
  const scrollPct = Math.max(ctx.progress.maxScrollPct, parsed.data.scrollPct);

  await db.$transaction([
    db.chapterProgress.update({
      where: { id: ctx.progress.id },
      data: {
        activeSeconds: { increment: delta },
        maxScrollPct: scrollPct,
        lastOpenedAt: new Date(),
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
        type: "CHAPTER_EXIT",
        courseId: ctx.courseId,
        chapterId: ctx.chapterId,
        metadata: { delta, scrollPct } as never,
        occurredAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
