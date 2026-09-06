import type { Metadata } from "next";

import { auth } from "@/auth";
import { CourseCatalog } from "@/components/course-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";

export const metadata: Metadata = { title: "Courses" };

/** Spelled out so the subhead reads as prose and cannot drift from the catalogue. */
const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const countWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

export default async function CoursesPage() {
  const session = await auth();

  const [courses, enrollments] = await Promise.all([
    db.course.findMany({
      where: { published: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        coverEmoji: true,
        level: true,
        tags: true,
        estimatedMinutes: true,
        _count: { select: { chapters: true } },
      },
    }),
    session?.user?.id
      ? db.enrollment.findMany({
          where: { userId: session.user.id },
          select: { courseId: true, progressPct: true },
        })
      : Promise.resolve([]),
  ]);

  const progressByCourse = new Map(
    enrollments.map((e) => [e.courseId, e.progressPct]),
  );

  await logEvent({ userId: session?.user?.id ?? null, type: "CATALOG_VIEW" });

  const cards = courses.map((c) => ({
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    coverEmoji: c.coverEmoji,
    level: c.level,
    tags: c.tags,
    estimatedMinutes: c.estimatedMinutes,
    chapterCount: c._count.chapters,
    progressPct: progressByCourse.get(c.id) ?? null,
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
        <h1 className="text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          Courses
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          {countWord(cards.length)} short courses. Every chapter is written to
          be finished in one sitting.
        </p>

        <CourseCatalog courses={cards} />
      </main>

      <SiteFooter />
    </div>
  );
}
