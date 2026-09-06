import "dotenv/config";
import bcrypt from "bcryptjs";

import { db } from "../src/lib/db";
import { makeSerial } from "../src/lib/certificate-serial";
import { COURSES } from "./seed/catalog";
import { loadChapters } from "./seed/content";
import { seedSyntheticLearners } from "./seed/history";

const DAY_MS = 86_400_000;

async function reset() {
  // Order matters only where cascades do not cover us; User + Course cascades
  // reach everything else.
  await db.recommendation.deleteMany();
  await db.mlProfile.deleteMany();
  await db.eventLog.deleteMany();
  await db.certificate.deleteMany();
  await db.chapterProgress.deleteMany();
  await db.enrollment.deleteMany();
  await db.learningSession.deleteMany();
  await db.chapter.deleteMany();
  await db.course.deleteMany();
  await db.user.deleteMany();
}

async function seedCourses() {
  const rows = [];
  for (const course of COURSES) {
    const chapters = loadChapters(course.dir);
    const estimatedMinutes = chapters.reduce((sum, c) => sum + c.estimatedMinutes, 0);

    const created = await db.course.create({
      data: {
        slug: course.slug,
        title: course.title,
        summary: course.summary,
        description: course.description,
        coverEmoji: course.coverEmoji,
        level: course.level,
        tags: course.tags,
        estimatedMinutes,
        chapters: {
          create: chapters.map((c) => ({
            order: c.order,
            slug: c.slug,
            title: c.title,
            contentMd: c.contentMd,
            wordCount: c.wordCount,
            estimatedMinutes: c.estimatedMinutes,
          })),
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        chapters: {
          select: { id: true, order: true, wordCount: true, estimatedMinutes: true },
          orderBy: { order: "asc" },
        },
      },
    });

    console.log(
      `  ${course.title} — ${created.chapters.length} chapters, ${estimatedMinutes} min`,
    );
    rows.push(created);
  }
  return rows;
}

/**
 * The demo student is hand-built rather than generated: the demo script walks
 * this account, so its shape must be exact — one course finished with a
 * certificate, one half-read, one enrolled but untouched.
 */
async function seedDemoStudent(
  userId: string,
  name: string,
  courses: Awaited<ReturnType<typeof seedCourses>>,
) {
  const now = Date.now();
  const [finished, halfway, untouched] = courses;

  const plan = [
    { course: finished, take: finished.chapters.length, startedDaysAgo: 30 },
    { course: halfway, take: Math.floor(halfway.chapters.length / 2), startedDaysAgo: 9 },
    { course: untouched, take: 0, startedDaysAgo: 2 },
  ];

  for (const [i, { course, take, startedDaysAgo }] of plan.entries()) {
    const enrolledAt = new Date(now - startedDaysAgo * DAY_MS);
    const complete = take === course.chapters.length;

    const enrollment = await db.enrollment.create({
      data: {
        userId,
        courseId: course.id,
        status: complete ? "COMPLETED" : "ACTIVE",
        progressPct: Math.round((take / course.chapters.length) * 100),
        enrolledAt,
        lastSeenAt: new Date(now - Math.max(1, startedDaysAgo - 5) * DAY_MS),
        completedAt: complete ? new Date(now - (startedDaysAgo - 6) * DAY_MS) : null,
        chapters: {
          create: course.chapters.map((ch, idx) => {
            const read = idx < take;
            const at = new Date(enrolledAt.getTime() + idx * DAY_MS);
            return {
              chapterId: ch.id,
              status: read ? ("COMPLETED" as const) : ("NOT_STARTED" as const),
              visits: read ? 1 : 0,
              activeSeconds: read ? Math.round((ch.wordCount / 200) * 60 * 1.1) : 0,
              maxScrollPct: read ? 96 : 0,
              firstOpenedAt: read ? at : null,
              lastOpenedAt: read ? at : null,
              completedAt: read ? at : null,
            };
          }),
        },
      },
      select: { id: true },
    });

    // Five past sittings for the demo account, so the dashboard has history.
    for (let s = 0; s < (i === 0 ? 3 : i === 1 ? 2 : 0); s += 1) {
      const startedAt = new Date(enrolledAt.getTime() + s * 3 * DAY_MS);
      const session = await db.learningSession.create({
        data: {
          userId,
          startedAt,
          lastBeatAt: new Date(startedAt.getTime() + 22 * 60_000),
          endedAt: new Date(startedAt.getTime() + 22 * 60_000),
          activeSeconds: 22 * 60,
          chaptersVisited: 3,
          chaptersCompleted: 3,
          endReason: "timeout",
        },
        select: { id: true },
      });
      await db.eventLog.createMany({
        data: [
          { userId, sessionId: session.id, type: "SESSION_START", occurredAt: startedAt, createdAt: startedAt },
          { userId, sessionId: session.id, type: "COURSE_VIEW", courseId: course.id, occurredAt: startedAt, createdAt: startedAt },
          {
            userId, sessionId: session.id, type: "SESSION_END",
            metadata: { endReason: "timeout" } as never,
            occurredAt: new Date(startedAt.getTime() + 22 * 60_000),
            createdAt: new Date(startedAt.getTime() + 22 * 60_000),
          },
        ],
      });
    }

    if (complete) {
      await db.certificate.create({
        data: {
          enrollmentId: enrollment.id,
          serial: makeSerial(new Date().getFullYear()),
          learnerName: name,
          courseTitle: course.title,
          issuedAt: new Date(now - (startedDaysAgo - 6) * DAY_MS),
        },
      });
    }
  }
}

async function main() {
  // The seed is DESTRUCTIVE — reset() deletes every user. `docker compose up`
  // re-runs the migrate service on each start, so without this guard a restart
  // would silently wipe real accounts. Re-seed deliberately with FORCE_SEED=1.
  const existingCourses = await db.course.count();
  if (existingCourses > 0 && process.env.FORCE_SEED !== "1") {
    console.log(
      `Database already has ${existingCourses} courses — skipping seed. ` +
        "Set FORCE_SEED=1 to wipe and re-seed.",
    );
    return;
  }

  console.log("Resetting…");
  await reset();

  console.log("Seeding courses…");
  const courses = await seedCourses();

  console.log("Seeding accounts…");
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const student = await db.user.create({
    data: { email: "student@demo.com", name: "Demo Student", passwordHash },
    select: { id: true, name: true },
  });
  await db.user.create({
    data: { email: "admin@demo.com", name: "Demo Admin", passwordHash, role: "ADMIN" },
  });

  await seedDemoStudent(student.id, student.name, courses);

  console.log("Seeding synthetic learners…");
  // bcrypt is deliberately hashed once and reused: 60 real hashes at cost 10
  // would add ~15s to every seed for accounts nobody logs into.
  const stats = await seedSyntheticLearners(db, courses, 60, passwordHash);

  console.log("\nSeed complete:");
  console.table(stats.personaCounts);
  console.log(
    `  ${stats.users} synthetic learners · ${stats.enrollments} enrolments · ` +
      `${stats.progress} chapter-progress rows · ${stats.certificates} certificates · ` +
      `${stats.events} events`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
