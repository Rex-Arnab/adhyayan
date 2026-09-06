import { db } from "@/lib/db";
import type { LearnerProfile } from "@/lib/reco/profile";

export type Candidate = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  coverEmoji: string;
  summary: string;
  tags: string[];
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedMinutes: number;
  chapterId: string | null;
  chapterSlug: string | null;
  chapterTitle: string | null;
  enrollmentCount: number;
  source: "CONTINUITY" | "ADJACENCY" | "COLLAB" | "REVIVAL" | "POPULAR";
};

const MAX_CANDIDATES = 20;
const MIN_USERS_FOR_COLLAB = 5;

/**
 * Assembles at most ~20 candidates from four cheap sources. Scoring the whole
 * catalogue is both slower and worse — a candidate that no source proposed is
 * one nothing about the learner's behaviour points at.
 */
export async function buildCandidates(
  profile: LearnerProfile,
): Promise<Candidate[]> {
  const courses = await db.course.findMany({
    where: { published: true },
    select: {
      id: true, slug: true, title: true, summary: true, coverEmoji: true,
      level: true, tags: true, estimatedMinutes: true,
      chapters: { orderBy: { order: "asc" }, select: { id: true, slug: true, title: true } },
      _count: { select: { enrollments: true } },
    },
  });
  const byId = new Map(courses.map((c) => [c.id, c]));
  const out = new Map<string, Candidate>();

  const add = (
    courseId: string,
    source: Candidate["source"],
    chapter?: { id: string; slug: string; title: string } | null,
  ) => {
    if (out.has(courseId) || out.size >= MAX_CANDIDATES) return;
    const c = byId.get(courseId);
    if (!c) return;
    if (profile.completedCourseIds.includes(courseId)) return; // hard exclusion
    out.set(courseId, {
      courseId: c.id, courseSlug: c.slug, courseTitle: c.title,
      coverEmoji: c.coverEmoji, summary: c.summary, tags: c.tags,
      level: c.level, estimatedMinutes: c.estimatedMinutes,
      chapterId: chapter?.id ?? null,
      chapterSlug: chapter?.slug ?? null,
      chapterTitle: chapter?.title ?? null,
      enrollmentCount: c._count.enrollments,
      source,
    });
  };

  // 1. Continuity — the next unread chapter of anything in progress.
  for (const p of profile.inProgress) {
    const c = byId.get(p.courseId);
    const chapter = c?.chapters.find((ch) => ch.id === p.nextChapterId) ?? null;
    add(p.courseId, "CONTINUITY", chapter);
  }

  // 2. Revival — abandoned courses, same shape but a different reason.
  for (const a of profile.abandoned) {
    const p = profile.inProgress.find((x) => x.courseId === a.courseId);
    const c = byId.get(a.courseId);
    const chapter = c?.chapters.find((ch) => ch.id === p?.nextChapterId) ?? null;
    add(a.courseId, "REVIVAL", chapter);
  }

  // 3. Collaborative — courses completed by people who completed what this
  //    learner completed. One query, item-to-item co-occurrence.
  if (profile.completedCourseIds.length > 0) {
    const userCount = await db.user.count();
    if (userCount >= MIN_USERS_FOR_COLLAB) {
      const peers = await db.enrollment.findMany({
        where: {
          status: "COMPLETED",
          courseId: { in: profile.completedCourseIds },
          userId: { not: profile.userId },
        },
        select: { userId: true },
      });
      const peerIds = [...new Set(peers.map((p) => p.userId))];

      if (peerIds.length > 0) {
        const alsoTook = await db.enrollment.groupBy({
          by: ["courseId"],
          where: {
            userId: { in: peerIds },
            courseId: { notIn: profile.enrolledCourseIds },
          },
          _count: { courseId: true },
          orderBy: { _count: { courseId: "desc" } },
          take: 6,
        });
        for (const row of alsoTook) {
          const c = byId.get(row.courseId);
          add(row.courseId, "COLLAB", c?.chapters[0] ?? null);
        }
      }
    }
  }

  // 4. Adjacency — unenrolled courses sharing a tag the learner spends time on.
  const affinities = Object.entries(profile.tagAffinity).sort((a, b) => b[1] - a[1]);
  for (const [tag] of affinities) {
    for (const c of courses) {
      if (profile.enrolledCourseIds.includes(c.id)) continue;
      if (!c.tags.includes(tag)) continue;
      add(c.id, "ADJACENCY", c.chapters[0] ?? null);
    }
  }

  // 5. Cold start — a learner with no history still needs something to click.
  if (out.size === 0) {
    const popular = [...courses]
      .filter((c) => !profile.enrolledCourseIds.includes(c.id))
      .sort((a, b) => {
        const byEnrol = b._count.enrollments - a._count.enrollments;
        return byEnrol !== 0 ? byEnrol : a.estimatedMinutes - b.estimatedMinutes;
      })
      .slice(0, 3);
    for (const c of popular) add(c.id, "POPULAR", c.chapters[0] ?? null);
  }

  return [...out.values()];
}
