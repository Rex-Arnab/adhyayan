import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ChapterFooter } from "@/components/learn/chapter-footer";
import { ChapterNav } from "@/components/learn/chapter-nav";
import { MobileChapterSheet } from "@/components/learn/mobile-chapter-sheet";
import { ReadingPane } from "@/components/learn/reading-pane";
import { ScrollProgress } from "@/components/learn/scroll-progress";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { getLearnContext } from "@/lib/progress";

type Params = { params: Promise<{ slug: string; chapterSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  const chapter = await db.chapter.findFirst({
    where: { slug: chapterSlug, course: { slug } },
    select: { title: true },
  });
  return chapter ? { title: chapter.title } : {};
}

export default async function LearnPage({ params }: Params) {
  const { slug, chapterSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/learn/${slug}/${chapterSlug}`);
  }

  const ctx = await getLearnContext(session.user.id, slug, chapterSlug);
  if (!ctx) notFound();

  // Not enrolled: send them to the course page rather than 500-ing or showing
  // a half-rendered reader.
  if (!ctx.enrollment) {
    redirect(`/courses/${slug}`);
  }

  await logEvent({
    userId: session.user.id,
    type: "CHAPTER_OPEN",
    courseId: ctx.course.id,
    chapterId: ctx.chapter.id,
  });

  const alreadyComplete =
    ctx.chapters.find((c) => c.id === ctx.chapter.id)?.status === "COMPLETED";

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollProgress />
      <SiteHeader />

      {/* Two independent columns. The sidebar is its own sticky element rather
          than a sticky grid item, so it cannot bleed over the footer. */}
      <div className="flex flex-1">
        <aside className="hidden w-[19rem] shrink-0 border-r lg:block">
          <div className="sticky top-20 h-[calc(100dvh-5rem)]">
            <ChapterNav
              courseSlug={ctx.course.slug}
              courseTitle={ctx.course.title}
              chapters={ctx.chapters}
              currentChapterId={ctx.chapter.id}
              progressPct={ctx.progressPct}
              completedCount={ctx.completedCount}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b px-4 py-3 sm:px-6 lg:hidden">
            <MobileChapterSheet
              courseSlug={ctx.course.slug}
              courseTitle={ctx.course.title}
              chapters={ctx.chapters}
              currentChapterId={ctx.chapter.id}
              progressPct={ctx.progressPct}
              completedCount={ctx.completedCount}
            />
          </div>

          <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
            <p className="reading-column mx-auto text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Chapter {ctx.chapter.order} of {ctx.chapters.length}
            </p>
            <div className="mt-4">
              <ReadingPane
                contentMd={ctx.chapter.contentMd}
                youtubeId={ctx.chapter.youtubeId}
              />
            </div>
          </main>

          <ChapterFooter
            chapterId={ctx.chapter.id}
            courseSlug={ctx.course.slug}
            previousSlug={ctx.previous?.slug ?? null}
            nextSlug={ctx.next?.slug ?? null}
            alreadyComplete={alreadyComplete}
            readingIndicator={
              <span>
                About {ctx.chapter.estimatedMinutes} min · {ctx.chapter.wordCount} words
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}
