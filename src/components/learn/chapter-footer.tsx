"use client";

import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { markChapterCompleteAction } from "@/lib/actions/progress";

export function ChapterFooter({
  chapterId,
  courseSlug,
  previousSlug,
  nextSlug,
  alreadyComplete,
  readingIndicator,
}: {
  chapterId: string;
  courseSlug: string;
  previousSlug: string | null;
  nextSlug: string | null;
  alreadyComplete: boolean;
  readingIndicator: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(alreadyComplete);

  function complete() {
    startTransition(async () => {
      const result = await markChapterCompleteAction(chapterId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDone(true);

      if (result.courseCompleted) {
        toast.success("Course complete. Your certificate is ready.");
        router.push(`/courses/${courseSlug}`);
        return;
      }
      if (nextSlug) {
        router.push(`/learn/${courseSlug}/${nextSlug}`);
      } else {
        router.push(`/courses/${courseSlug}`);
      }
      router.refresh();
    });
  }

  return (
    <div className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
        {previousSlug ? (
          <Link
            href={`/learn/${courseSlug}/${previousSlug}`}
            className="flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2.5 text-sm font-semibold transition-colors duration-150 hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Previous</span>
          </Link>
        ) : (
          <span className="w-px" />
        )}

        <div className="flex-1 text-center text-xs font-semibold text-muted-foreground">
          {readingIndicator}
        </div>

        <button
          type="button"
          onClick={complete}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : done ? (
            <Check className="size-4" aria-hidden />
          ) : null}
          <span>
            {done
              ? nextSlug
                ? "Next chapter"
                : "Finish course"
              : nextSlug
                ? "Mark complete & continue"
                : "Mark complete & finish"}
          </span>
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
