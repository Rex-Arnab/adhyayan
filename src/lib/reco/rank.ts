import type { Candidate } from "@/lib/reco/candidates";
import type { LearnerProfile } from "@/lib/reco/profile";

/**
 * Deterministic weights. This is the system of record: it is free, instant,
 * works offline, and any ML layer only ever re-ranks on top of it. Exported so
 * the Python trainer can compare its learned weights against this baseline.
 */
export const WEIGHTS = {
  continuity: 0.35,
  tagAffinity: 0.25,
  difficultyFit: 0.15,
  effortFit: 0.1,
  popularity: 0.1,
  freshness: 0.05,
} as const;

export type FeatureVector = Record<keyof typeof WEIGHTS, number>;

export type ScoredCandidate = Candidate & {
  score: number;
  features: FeatureVector;
  contributions: FeatureVector;
  topFeature: keyof typeof WEIGHTS;
  reason: string;
};

const LEVEL_RANK = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 } as const;

export function computeFeatures(
  candidate: Candidate,
  profile: LearnerProfile,
  maxEnrollments: number,
): FeatureVector {
  const continuity =
    candidate.source === "CONTINUITY" ? 1 : candidate.source === "REVIVAL" ? 0.6 : 0;

  const tags = candidate.tags.map((t) => profile.tagAffinity[t] ?? 0);
  const tagAffinity = tags.length === 0 ? 0 : Math.max(...tags);

  // Demonstrated level: everything is BEGINNER today, so this stays 1.0 and
  // becomes meaningful the moment a non-beginner course exists.
  const demonstrated = profile.completedCourseIds.length >= 2 ? 1 : 0;
  const distance = Math.abs(LEVEL_RANK[candidate.level] - demonstrated);
  const difficultyFit = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.1;

  // Does it fit a typical sitting?
  const budget = profile.avgSessionMinutes || 20;
  const effortFit =
    candidate.estimatedMinutes <= budget
      ? 1
      : Math.max(0, 1 - (candidate.estimatedMinutes - budget) / (budget * 2));

  const popularity =
    maxEnrollments <= 0
      ? 0
      : Math.log1p(candidate.enrollmentCount) / Math.log1p(maxEnrollments);

  const freshness = candidate.source === "COLLAB" || candidate.source === "ADJACENCY" ? 1 : 0.5;

  return { continuity, tagAffinity, difficultyFit, effortFit, popularity, freshness };
}

/**
 * Reason templates keyed by the feature that contributed most.
 *
 * Grounding the sentence in the winning feature is what makes it explainable
 * rather than merely plausible — the text and the score cannot disagree.
 */
function buildReason(
  top: keyof typeof WEIGHTS,
  c: Candidate,
  p: LearnerProfile,
): string {
  switch (top) {
    case "continuity": {
      const inProg = p.inProgress.find((x) => x.courseId === c.courseId);
      // "Continues ... 0% through" is nonsense — an enrolled-but-untouched
      // course is being started, not continued.
      if (!inProg) return `Picks up where you left off in ${c.courseTitle}.`;
      if (inProg.progressPct === 0) {
        return `You enrolled in ${c.courseTitle} but have not opened it yet.`;
      }
      return `Continues ${c.courseTitle}, where you are ${inProg.progressPct}% through.`;
    }
    case "tagAffinity": {
      const best = c.tags
        .map((t) => [t, p.tagAffinity[t] ?? 0] as const)
        .sort((a, b) => b[1] - a[1])[0];
      return best && best[1] > 0
        ? `You spend most of your reading time on ${best[0]} — this builds on it.`
        : `Covers ${c.tags.slice(0, 2).join(" and ")}.`;
    }
    case "effortFit":
      return `Fits one sitting — about ${c.estimatedMinutes} minutes, and your sessions average ${p.avgSessionMinutes || 20}.`;
    case "popularity":
      return `One of the most taken courses here, and you have not started it yet.`;
    case "freshness":
      return c.source === "COLLAB"
        ? `Learners who finished the same courses as you usually take this next.`
        : `A new direction from the topics you already read.`;
    case "difficultyFit":
      return `Pitched at the level you have been reading at.`;
    default:
      return `Recommended based on what you have been reading.`;
  }
}

export function rankCandidates(
  candidates: Candidate[],
  profile: LearnerProfile,
): ScoredCandidate[] {
  const maxEnrollments = Math.max(1, ...candidates.map((c) => c.enrollmentCount));

  return candidates
    .map((candidate) => {
      const features = computeFeatures(candidate, profile, maxEnrollments);

      const contributions = Object.fromEntries(
        (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map((k) => [
          k,
          WEIGHTS[k] * features[k],
        ]),
      ) as FeatureVector;

      const score = Object.values(contributions).reduce((a, b) => a + b, 0);

      const topFeature = (Object.keys(contributions) as (keyof typeof WEIGHTS)[]).reduce(
        (best, k) => (contributions[k] > contributions[best] ? k : best),
      );

      return {
        ...candidate,
        features,
        contributions,
        score,
        topFeature,
        reason: buildReason(topFeature, candidate, profile),
      };
    })
    .sort((a, b) => b.score - a.score);
}
