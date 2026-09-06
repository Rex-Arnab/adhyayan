import type { PrismaClient } from "../../src/generated/prisma/client";
import { makeSerial } from "../../src/lib/certificate-serial";
import { BASELINE_WPM } from "../../src/lib/reading";
import { type Persona, pickPersona, rng } from "./personas";

type ChapterRow = { id: string; order: number; wordCount: number; estimatedMinutes: number };
type CourseRow = { id: string; slug: string; title: string; chapters: ChapterRow[] };

type EventRow = {
  userId: string;
  sessionId: string | null;
  type: string;
  courseId: string | null;
  chapterId: string | null;
  metadata: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;
};

const DAY_MS = 86_400_000;

const between = (r: () => number, [lo, hi]: [number, number]) =>
  lo + Math.floor(r() * (hi - lo + 1));

/**
 * Generates behaviourally coherent history for one learner and returns the rows
 * to insert. Nothing is written here — the caller batches all inserts, which
 * keeps ~60 learners to a handful of round trips instead of thousands.
 */
function buildLearner(
  userId: string,
  persona: Persona,
  courses: Map<string, CourseRow>,
  r: () => number,
  now: number,
) {
  const sessions: {
    id: string;
    startedAt: Date;
    lastBeatAt: Date;
    endedAt: Date;
    activeSeconds: number;
    chaptersVisited: number;
    chaptersCompleted: number;
    endReason: string;
  }[] = [];
  const enrollments: {
    id: string;
    courseId: string;
    status: "ACTIVE" | "COMPLETED" | "DROPPED";
    progressPct: number;
    enrolledAt: Date;
    lastSeenAt: Date;
    completedAt: Date | null;
  }[] = [];
  const progress: {
    enrollmentId: string;
    chapterId: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    visits: number;
    activeSeconds: number;
    maxScrollPct: number;
    firstOpenedAt: Date | null;
    lastOpenedAt: Date | null;
    completedAt: Date | null;
  }[] = [];
  const certificates: {
    enrollmentId: string;
    serial: string;
    learnerName: string;
    courseTitle: string;
    issuedAt: Date;
  }[] = [];
  const events: EventRow[] = [];

  // How many courses this learner touches, in their persona's preferred order.
  const takeCount = Math.min(
    1 + between(r, [0, persona.breadth]),
    persona.courseOrder.length,
  );
  const chosen = persona.courseOrder.slice(0, takeCount);

  // Spread the first enrolment across the last 8 weeks.
  let cursor = now - (14 + Math.floor(r() * 42)) * DAY_MS;

  for (const [courseIndex, slug] of chosen.entries()) {
    const course = courses.get(slug);
    if (!course) continue;

    const enrollmentId = `enr_${userId}_${courseIndex}`;
    const enrolledAt = new Date(cursor);

    events.push({
      userId, sessionId: null, type: "CATALOG_VIEW", courseId: null, chapterId: null,
      metadata: {}, occurredAt: enrolledAt, createdAt: enrolledAt,
    });
    events.push({
      userId, sessionId: null, type: "COURSE_VIEW", courseId: course.id, chapterId: null,
      metadata: {}, occurredAt: enrolledAt, createdAt: enrolledAt,
    });
    events.push({
      userId, sessionId: null, type: "COURSE_ENROLL", courseId: course.id, chapterId: null,
      metadata: {}, occurredAt: enrolledAt, createdAt: enrolledAt,
    });

    // Does this learner finish? Later courses are likelier to be abandoned.
    const finishes = r() < persona.completion * (courseIndex === 0 ? 1 : 0.7);
    const target = finishes
      ? course.chapters.length
      : Math.max(1, Math.floor(course.chapters.length * (0.15 + r() * 0.5)));

    let done = 0;
    let lastTouch = enrolledAt;

    while (done < target) {
      const batch = Math.min(between(r, persona.chaptersPerSession), target - done);
      const startedAt = new Date(cursor + (persona.hour * 3600_000) + Math.floor(r() * 1800_000));
      const sessionId = `ses_${userId}_${courseIndex}_${done}`;
      let sessionSeconds = 0;
      let completedInSession = 0;
      let clock = startedAt.getTime();

      events.push({
        userId, sessionId, type: "SESSION_START", courseId: null, chapterId: null,
        metadata: {}, occurredAt: new Date(clock), createdAt: new Date(clock),
      });

      for (let i = 0; i < batch; i += 1) {
        const chapter = course.chapters[done];
        if (!chapter) break;

        // Active seconds derive from real word count and the persona's speed,
        // with noise — this is what makes readingSpeedWpm a learnable feature.
        const expected = (chapter.wordCount / (BASELINE_WPM * persona.speed)) * 60;
        const activeSeconds = Math.max(30, Math.round(expected * (0.7 + r() * 0.6)));
        const scroll = persona.id === "skimmer" ? between(r, [45, 80]) : between(r, [88, 100]);
        const openedAt = new Date(clock);

        events.push({
          userId, sessionId, type: "CHAPTER_OPEN", courseId: course.id, chapterId: chapter.id,
          metadata: {}, occurredAt: openedAt, createdAt: openedAt,
        });

        // One heartbeat per ~20s of reading, matching the live client's cadence.
        const beats = Math.max(1, Math.round(activeSeconds / 20));
        for (let b = 1; b <= beats; b += 1) {
          const at = new Date(clock + b * 20_000);
          events.push({
            userId, sessionId, type: "CHAPTER_HEARTBEAT", courseId: course.id,
            chapterId: chapter.id,
            metadata: { delta: 20, scrollPct: Math.min(scroll, Math.round((b / beats) * scroll)) },
            occurredAt: at, createdAt: at,
          });
        }

        clock += activeSeconds * 1000;
        const finishedAt = new Date(clock);
        const completed = scroll >= 85 || r() < 0.9;

        progress.push({
          enrollmentId,
          chapterId: chapter.id,
          status: completed ? "COMPLETED" : "IN_PROGRESS",
          visits: 1 + (r() < 0.2 ? 1 : 0),
          activeSeconds,
          maxScrollPct: scroll,
          firstOpenedAt: openedAt,
          lastOpenedAt: finishedAt,
          completedAt: completed ? finishedAt : null,
        });

        if (completed) {
          events.push({
            userId, sessionId, type: "CHAPTER_COMPLETE", courseId: course.id,
            chapterId: chapter.id, metadata: { activeSeconds },
            occurredAt: finishedAt, createdAt: finishedAt,
          });
          completedInSession += 1;
        }
        if (i < batch - 1) {
          events.push({
            userId, sessionId, type: "CHAPTER_NEXT", courseId: course.id,
            chapterId: chapter.id, metadata: { from: chapter.order, to: chapter.order + 1 },
            occurredAt: finishedAt, createdAt: finishedAt,
          });
        }

        sessionSeconds += activeSeconds;
        lastTouch = finishedAt;
        done += 1;
        clock += 15_000; // a beat between chapters
      }

      const endedAt = new Date(clock);
      events.push({
        userId, sessionId, type: "SESSION_END", courseId: null, chapterId: null,
        metadata: { endReason: "timeout" }, occurredAt: endedAt, createdAt: endedAt,
      });

      sessions.push({
        id: sessionId,
        startedAt,
        lastBeatAt: endedAt,
        endedAt,
        activeSeconds: sessionSeconds,
        chaptersVisited: batch,
        chaptersCompleted: completedInSession,
        endReason: "timeout",
      });

      // Next sitting: 1–5 days later.
      cursor += (1 + Math.floor(r() * 4)) * DAY_MS;
      if (cursor > now) break;
    }

    const completedCourse = done >= course.chapters.length;
    const progressPct = Math.round((done / course.chapters.length) * 100);

    enrollments.push({
      id: enrollmentId,
      courseId: course.id,
      status: completedCourse ? "COMPLETED" : "ACTIVE",
      progressPct,
      enrolledAt,
      lastSeenAt: lastTouch,
      completedAt: completedCourse ? lastTouch : null,
    });

    if (completedCourse) {
      events.push({
        userId, sessionId: null, type: "COURSE_COMPLETE", courseId: course.id,
        chapterId: null, metadata: {}, occurredAt: lastTouch, createdAt: lastTouch,
      });
      certificates.push({
        enrollmentId,
        serial: makeSerial(lastTouch.getFullYear(), r),
        learnerName: "",
        courseTitle: course.title,
        issuedAt: lastTouch,
      });
      events.push({
        userId, sessionId: null, type: "CERTIFICATE_ISSUE", courseId: course.id,
        chapterId: null, metadata: {}, occurredAt: lastTouch, createdAt: lastTouch,
      });
    }

    // Gap before starting the next course.
    cursor += (2 + Math.floor(r() * 6)) * DAY_MS;
    if (cursor > now) break;
  }

  return { sessions, enrollments, progress, certificates, events };
}

export async function seedSyntheticLearners(
  db: PrismaClient,
  courses: CourseRow[],
  count: number,
  passwordHash: string,
) {
  const byslug = new Map(courses.map((c) => [c.slug, c]));
  const now = Date.now();
  const r = rng(20260906);

  const users = Array.from({ length: count }, (_, i) => {
    const persona = pickPersona(r());
    return {
      id: `syn_${String(i).padStart(3, "0")}`,
      email: `learner${String(i).padStart(3, "0")}@synthetic.local`,
      name: `Learner ${String(i).padStart(3, "0")}`,
      passwordHash,
      persona,
    };
  });

  await db.user.createMany({
    data: users.map(({ persona: _p, ...u }) => u),
    skipDuplicates: true,
  });

  const allSessions = [];
  const allEnrollments = [];
  const allProgress = [];
  const allCertificates = [];
  const allEvents: EventRow[] = [];

  for (const user of users) {
    const built = buildLearner(user.id, user.persona, byslug, r, now);
    allSessions.push(...built.sessions.map((s) => ({ ...s, userId: user.id })));
    allEnrollments.push(...built.enrollments.map((e) => ({ ...e, userId: user.id })));
    allProgress.push(...built.progress);
    allCertificates.push(
      ...built.certificates.map((c) => ({ ...c, learnerName: user.name })),
    );
    allEvents.push(...built.events);
  }

  await db.learningSession.createMany({ data: allSessions, skipDuplicates: true });
  await db.enrollment.createMany({ data: allEnrollments, skipDuplicates: true });
  await db.chapterProgress.createMany({ data: allProgress, skipDuplicates: true });
  await db.certificate.createMany({ data: allCertificates, skipDuplicates: true });

  // Events are the biggest table — chunk so a single statement stays sane.
  for (let i = 0; i < allEvents.length; i += 2000) {
    await db.eventLog.createMany({
      data: allEvents.slice(i, i + 2000) as never,
      skipDuplicates: true,
    });
  }

  const personaCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.persona.id] = (acc[u.persona.id] ?? 0) + 1;
    return acc;
  }, {});

  return {
    users: users.length,
    sessions: allSessions.length,
    enrollments: allEnrollments.length,
    progress: allProgress.length,
    certificates: allCertificates.length,
    events: allEvents.length,
    personaCounts,
  };
}
