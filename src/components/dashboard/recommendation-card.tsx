"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { recordRecommendationClick } from "@/lib/actions/recommendations";
import type { RecommendationCard as Card } from "@/lib/reco/service";

const SURFACES = ["bg-sky", "bg-tangerine", "bg-lilac"] as const;

export function RecommendationCard({ card, index }: { card: Card; index: number }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        // Record the click, then navigate. Click-through is the metric that
        // proves the recommender changes behaviour, so it must not be lossy.
        startTransition(async () => {
          await recordRecommendationClick(card.id);
          router.push(card.href);
        });
      }}
      className={`group flex h-full flex-col rounded-3xl p-6 text-left text-deep transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground ${SURFACES[index % SURFACES.length]}`}
    >
      <span aria-hidden className="text-2xl">{card.coverEmoji}</span>

      <h3 className="mt-3 text-xl font-extrabold tracking-[-0.025em]">
        {card.chapterTitle ?? card.courseTitle}
      </h3>
      {card.chapterTitle ? (
        <p className="mt-1 text-sm font-bold opacity-70">{card.courseTitle}</p>
      ) : null}

      {/* The reason is the whole point — a bare list of courses reads as a menu,
          not a recommendation. */}
      <p className="mt-3 flex-1 text-[0.95rem] font-medium leading-snug opacity-90">
        {card.reason}
      </p>

      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold">
        {card.chapterSlug ? "Start reading" : "View course"}
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden
        />
      </span>
    </button>
  );
}
