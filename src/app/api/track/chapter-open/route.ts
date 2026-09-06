import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { resolveTrackingContext } from "@/lib/tracking";

export const runtime = "nodejs";

const Body = z.object({ chapterId: z.string() });

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

  const now = new Date();
  await db.chapterProgress.update({
    where: { id: ctx.progress.id },
    data: {
      visits: { increment: 1 },
      firstOpenedAt: ctx.progress.firstOpenedAt ?? now,
      lastOpenedAt: now,
      ...(ctx.progress.status === "NOT_STARTED"
        ? { status: "IN_PROGRESS" as const }
        : {}),
    },
  });

  await db.learningSession.update({
    where: { id: ctx.learningSessionId },
    data: { chaptersVisited: { increment: 1 }, lastBeatAt: now },
  });

  await logEvent({
    userId: ctx.userId,
    sessionId: ctx.learningSessionId,
    type: "CHAPTER_OPEN",
    courseId: ctx.courseId,
    chapterId: ctx.chapterId,
  });

  return NextResponse.json({
    ok: true,
    activeSeconds: ctx.progress.activeSeconds,
    maxScrollPct: ctx.progress.maxScrollPct,
  });
}
