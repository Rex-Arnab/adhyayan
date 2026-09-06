import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { buildCandidates } from "@/lib/reco/candidates";
import { buildLearnerProfile } from "@/lib/reco/profile";
import { rankCandidates } from "@/lib/reco/rank";

export const RECOMMENDATION_COUNT = 3;
const STALE_MS = 24 * 60 * 60 * 1000;
/** ML rows are refreshed by a batch job, so they get a longer grace period. */
const ML_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export type RecommendationCard = {
  id: string;
  courseSlug: string;
  courseTitle: string;
  coverEmoji: string;
  summary: string;
  chapterSlug: string | null;
  chapterTitle: string | null;
  estimatedMinutes: number;
  reason: string;
  source: string;
  href: string;
};

/**
 * Returns cached rows when they are fresh, and regenerates otherwise.
 *
 * Regenerating on every dashboard render would be slow and would churn the
 * table; the cache is invalidated by staleness or by the learner completing a
 * chapter / enrolling since the rows were written.
 */
export async function getRecommendations(
  userId: string,
): Promise<RecommendationCard[]> {
  // Prefer rows written by the ML batch scorer. They are the better ranking when
  // present; the heuristic exists so the feature still works when they are not.
  const mlRows = await db.recommendation.findMany({
    where: { userId, source: "ML_RANKER" },
    orderBy: { rank: "asc" },
    take: RECOMMENDATION_COUNT,
  });

  if (
    mlRows.length > 0 &&
    Date.now() - mlRows[0].generatedAt.getTime() <= ML_STALE_MS
  ) {
    return hydrate(mlRows);
  }

  const cached = await db.recommendation.findMany({
    where: { userId, source: "HEURISTIC" },
    orderBy: [{ generatedAt: "desc" }, { rank: "asc" }],
    take: RECOMMENDATION_COUNT,
  });

  const newest = cached[0]?.generatedAt.getTime() ?? 0;
  const isStale = Date.now() - newest > STALE_MS;

  let invalidatedByActivity = false;
  if (cached.length > 0 && !isStale) {
    const changed = await db.eventLog.count({
      where: {
        userId,
        type: { in: ["CHAPTER_COMPLETE", "COURSE_ENROLL", "COURSE_COMPLETE"] },
        createdAt: { gt: cached[0].generatedAt },
      },
    });
    invalidatedByActivity = changed > 0;
  }

  if (cached.length > 0 && !isStale && !invalidatedByActivity) {
    return hydrate(cached);
  }

  return generateRecommendations(userId);
}

export async function generateRecommendations(
  userId: string,
): Promise<RecommendationCard[]> {
  const profile = await buildLearnerProfile(userId);
  const candidates = await buildCandidates(profile);
  const ranked = rankCandidates(candidates, profile).slice(0, RECOMMENDATION_COUNT);

  if (ranked.length === 0) return [];

  const generatedAt = new Date();
  // Deterministic A/B assignment so a learner never flips arm between renders.
  const variant = hashToVariant(userId);

  await db.$transaction([
    db.recommendation.deleteMany({ where: { userId, source: "HEURISTIC" } }),
    db.recommendation.createMany({
      data: ranked.map((r, i) => ({
        userId,
        courseId: r.courseId,
        chapterId: r.chapterId,
        score: r.score,
        reason: r.reason,
        source: "HEURISTIC",
        variant,
        rank: i + 1,
        generatedAt,
        features: {
          features: r.features,
          contributions: r.contributions,
          topFeature: r.topFeature,
          candidateSource: r.source,
        } as never,
      })),
    }),
  ]);

  const rows = await db.recommendation.findMany({
    where: { userId, source: "HEURISTIC" },
    orderBy: { rank: "asc" },
    take: RECOMMENDATION_COUNT,
  });
  return hydrate(rows);
}

export function hashToVariant(userId: string): "ML" | "HEURISTIC" {
  let h = 0;
  for (let i = 0; i < userId.length; i += 1) {
    h = (h * 31 + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2 === 0 ? "HEURISTIC" : "ML";
}

type Row = {
  id: string;
  courseId: string;
  chapterId: string | null;
  reason: string;
  source: string;
};

async function hydrate(rows: Row[]): Promise<RecommendationCard[]> {
  if (rows.length === 0) return [];

  const [courses, chapters] = await Promise.all([
    db.course.findMany({
      where: { id: { in: rows.map((r) => r.courseId) } },
      select: {
        id: true, slug: true, title: true, coverEmoji: true,
        summary: true, estimatedMinutes: true,
      },
    }),
    db.chapter.findMany({
      where: { id: { in: rows.flatMap((r) => (r.chapterId ? [r.chapterId] : [])) } },
      select: { id: true, slug: true, title: true },
    }),
  ]);

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const chapterById = new Map(chapters.map((c) => [c.id, c]));

  return rows.flatMap((row) => {
    const course = courseById.get(row.courseId);
    if (!course) return [];
    const chapter = row.chapterId ? chapterById.get(row.chapterId) : null;

    return [{
      id: row.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      coverEmoji: course.coverEmoji,
      summary: course.summary,
      chapterSlug: chapter?.slug ?? null,
      chapterTitle: chapter?.title ?? null,
      estimatedMinutes: course.estimatedMinutes,
      reason: row.reason,
      source: row.source,
      // Deep-link straight into the chapter when we know it.
      href: chapter
        ? `/learn/${course.slug}/${chapter.slug}`
        : `/courses/${course.slug}`,
    }];
  });
}

/** Stamps shownAt once per generation, not once per re-render. */
export async function markRecommendationsShown(
  userId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const updated = await db.recommendation.updateMany({
    where: { id: { in: ids }, shownAt: null },
    data: { shownAt: new Date() },
  });
  if (updated.count > 0) {
    await logEvent({
      userId,
      type: "RECOMMENDATION_SHOWN",
      metadata: { count: updated.count },
    });
  }
}
