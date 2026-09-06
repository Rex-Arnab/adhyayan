"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { enrollAction } from "@/lib/actions/enroll";

export function EnrollButton({
  courseId,
  courseSlug,
  firstChapterSlug,
  isSignedIn,
  isEnrolled,
  progressPct,
}: {
  courseId: string;
  courseSlug: string;
  firstChapterSlug: string;
  isSignedIn: boolean;
  isEnrolled: boolean;
  progressPct: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);

  const cta =
    "inline-block rounded-2xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:opacity-60";

  if (isEnrolled) {
    return (
      <div className="max-w-sm">
        <Link href={`/learn/${courseSlug}/${firstChapterSlug}`} className={cta}>
          {progressPct > 0 ? "Continue learning" : "Start chapter 1"}
        </Link>
        {progressPct > 0 ? (
          <div className="mt-4">
            <Progress value={progressPct} className="h-2" />
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {progressPct}% complete
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <Link href={`/login?callbackUrl=/courses/${courseSlug}`} className={cta}>
          Sign in to enrol
        </Link>
        <p className="text-sm font-medium text-muted-foreground">
          Chapter 1 is free to read without an account.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      // Guard the double-click: the action is idempotent server-side, but the
      // second click should not fire a second navigation.
      disabled={pending || clicked}
      className={cta}
      onClick={() => {
        setClicked(true);
        startTransition(async () => {
          const result = await enrollAction(courseId);
          if (!result.ok) {
            setClicked(false);
            toast.error(result.error);
            return;
          }
          router.push(`/learn/${result.courseSlug}/${result.firstChapterSlug}`);
        });
      }}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Enrolling…
        </span>
      ) : (
        "Enrol for free"
      )}
    </button>
  );
}
