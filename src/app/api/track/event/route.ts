import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { EVENT_TYPES, logEvent, type EventType } from "@/lib/events";
import { getOrCreateSession } from "@/lib/session-manager";

export const runtime = "nodejs";

const Body = z.object({
  // Whitelisted against the taxonomy: the generic endpoint must not become a
  // way for a client to invent event types the ML extractor cannot interpret.
  type: z.enum(EVENT_TYPES as unknown as [EventType, ...EventType[]]),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime().optional(),
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
    return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const learningSessionId = userId ? await getOrCreateSession(userId) : null;

  await logEvent({
    userId,
    sessionId: learningSessionId,
    type: parsed.data.type,
    courseId: parsed.data.courseId ?? null,
    chapterId: parsed.data.chapterId ?? null,
    metadata: parsed.data.metadata ?? {},
    occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
  });

  return NextResponse.json({ ok: true });
}
