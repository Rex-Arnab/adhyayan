"use server";

import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";

export async function recordRecommendationClick(id: string): Promise<void> {
  const user = await requireUser();
  if (!user) return;

  const updated = await db.recommendation.updateMany({
    where: { id, userId: user.id, clickedAt: null },
    data: { clickedAt: new Date() },
  });
  if (updated.count === 0) return;

  const row = await db.recommendation.findUnique({
    where: { id },
    select: { courseId: true, chapterId: true, source: true, variant: true, rank: true },
  });

  await logEvent({
    userId: user.id,
    type: "RECOMMENDATION_CLICK",
    courseId: row?.courseId ?? null,
    chapterId: row?.chapterId ?? null,
    metadata: { source: row?.source, variant: row?.variant, rank: row?.rank },
  });
}
