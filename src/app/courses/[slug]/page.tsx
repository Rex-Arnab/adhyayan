import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { auth } from "@/auth";
import { EnrollButton } from "@/components/enroll-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { formatMinutes } from "@/lib/reading";

type Params = { params: Promise<{ slug: string }> };

async function getCourse(slug: string) {
  return db.course.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, title: true, summary: true, description: true,
      coverEmoji: true, level: true, tags: true, estimatedMinutes: true, published: true,
      chapters: {
        orderBy: { order: "asc" },
        select: { id: true, order: true, slug: true, title: true, estimatedMinutes: true },
      },
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  return course ? { title: course.title, description: course.summary } : {};
}

export default async function CoursePage({ params }: Params) {
  const { slug } = await params;
  const [session, course] = await Promise.all([auth(), getCourse(slug)]);
  if (!course || !course.published) notFound();

  const enrollment = session?.user?.id
    ? await db.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
        select: {
          id: true, progressPct: true, status: true,
          chapters: { select: { chapterId: true, status: true } },
        },
      })
    : null;

  await logEvent({
    userId: session?.user?.id ?? null,
    type: "COURSE_VIEW",
    courseId: course.id,
  });

  const statusByChapter = new Map(
    enrollment?.chapters.map((c) => [c.chapterId, c.status]) ?? [],
  );

  // Continue where they left off: first chapter that is not yet complete.
  const nextChapter =
    course.chapters.find((c) => statusByChapter.get(c.id) !== "COMPLETED") ??
    course.chapters[0];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b bg-card">
          <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span className="capitalize">{course.level.toLowerCase()}</span>
              <span aria-hidden>·</span>
              <span>{course.chapters.length} chapters</span>
              <span aria-hidden>·</span>
              <span>{formatMinutes(course.estimatedMinutes)}</span>
            </div>

            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              <span aria-hidden className="mr-3">{course.coverEmoji}</span>
              {course.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {course.summary}
            </p>

            <div className="mt-8">
              <EnrollButton
                courseId={course.id}
                courseSlug={course.slug}
                firstChapterSlug={nextChapter?.slug ?? ""}
                isSignedIn={Boolean(session?.user)}
                isEnrolled={Boolean(enrollment)}
                progressPct={enrollment?.progressPct ?? 0}
              />
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-5xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_20rem]">
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">About this course</h2>
            <div className="reading-column mt-4 space-y-4 text-foreground/90 [&_p]:leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {course.description}
              </ReactMarkdown>
            </div>

            <h2 className="mt-12 text-2xl font-extrabold tracking-[-0.03em]">Chapters</h2>
            <ol className="mt-4 divide-y rounded-3xl border bg-card">
              {course.chapters.map((chapter, i) => {
                const status = statusByChapter.get(chapter.id);
                const done = status === "COMPLETED";
                // Chapter 1 is always previewable — that is the hook.
                const open = Boolean(enrollment) || i === 0;

                return (
                  <li key={chapter.id}>
                    <ChapterRow
                      href={open ? `/learn/${course.slug}/${chapter.slug}` : undefined}
                      order={chapter.order}
                      title={chapter.title}
                      minutes={chapter.estimatedMinutes}
                      done={done}
                      locked={!open}
                      preview={!enrollment && i === 0}
                    />
                  </li>
                );
              })}
            </ol>
          </div>

          <aside className="lg:pt-2">
            <div className="rounded-3xl border bg-card p-6">
              <h3 className="font-extrabold tracking-[-0.02em]">Topics</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Finish every chapter to earn a certificate with a public
                verification link.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ChapterRow({
  href, order, title, minutes, done, locked, preview,
}: {
  href?: string; order: number; title: string; minutes: number;
  done: boolean; locked: boolean; preview: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-4 px-5 py-4">
      <span aria-hidden className="shrink-0">
        {done ? (
          <CheckCircle2 className="size-5 text-success" />
        ) : locked ? (
          <Lock className="size-5 text-muted-foreground/60" />
        ) : (
          <Circle className="size-5 text-muted-foreground/60" />
        )}
      </span>
      <span className="w-6 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
        {order}
      </span>
      <span className="flex-1 font-medium">{title}</span>
      {preview ? (
        <span className="rounded-full bg-lilac px-2.5 py-1 text-xs font-bold text-deep">
          Free preview
        </span>
      ) : null}
      <span className="shrink-0 text-sm text-muted-foreground">{minutes} min</span>
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground"
    >
      {inner}
    </Link>
  ) : (
    <div className="opacity-60">{inner}</div>
  );
}
