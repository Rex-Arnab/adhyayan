import Link from "next/link";
import { Check } from "lucide-react";

import { ProgressRing } from "@/components/learn/progress-ring";
import type { LearnChapter } from "@/lib/progress";

/**
 * The chapter list. Rendered both in the desktop sidebar and inside the mobile
 * sheet, so it takes no positioning of its own.
 */
export function ChapterNav({
  courseSlug,
  courseTitle,
  chapters,
  currentChapterId,
  progressPct,
  completedCount,
  onNavigate,
  inSheet = false,
}: {
  courseSlug: string;
  courseTitle: string;
  chapters: LearnChapter[];
  currentChapterId: string;
  progressPct: number;
  completedCount: number;
  onNavigate?: () => void;
  /** Reserves room for the sheet's close button so the title cannot run under it. */
  inSheet?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-start gap-3 border-b py-4 pl-4 ${inSheet ? "pr-14" : "pr-4"}`}
      >
        <ProgressRing value={progressPct} label={`${progressPct}% of course complete`} />
        <div className="min-w-0">
          <Link
            href={`/courses/${courseSlug}`}
            onClick={onNavigate}
            className="block truncate font-bold tracking-[-0.02em] hover:underline"
          >
            {courseTitle}
          </Link>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
            {completedCount} of {chapters.length} chapters done
          </p>
        </div>
      </div>

      <ol className="min-h-0 flex-1 overflow-y-auto py-2">
        {chapters.map((chapter) => {
          const current = chapter.id === currentChapterId;
          const done = chapter.status === "COMPLETED";
          const started = chapter.status === "IN_PROGRESS";

          return (
            <li key={chapter.id}>
              <Link
                href={`/learn/${courseSlug}/${chapter.slug}`}
                onClick={onNavigate}
                aria-current={current ? "page" : undefined}
                className={`flex items-start gap-3 px-4 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground ${
                  current
                    ? "bg-muted font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-success bg-success"
                      : started
                        ? "border-progress bg-progress/30"
                        : "border-muted-foreground/40"
                  }`}
                >
                  {done ? <Check className="size-2.5 text-white" strokeWidth={4} /> : null}
                </span>

                <span className="flex-1 leading-snug">
                  {chapter.order}. {chapter.title}
                </span>

                <span className="shrink-0 text-xs tabular-nums opacity-70">
                  {chapter.estimatedMinutes}m
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
