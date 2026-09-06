"use client";

import { createContext, useContext } from "react";

import {
  useReadingTracker,
  type ReadingTrackerState,
} from "@/hooks/use-reading-tracker";

const TrackerContext = createContext<ReadingTrackerState>({
  activeSeconds: 0,
  scrollPct: 0,
  isActive: true,
});

export function ReadingTrackerProvider({
  chapterId,
  initialActiveSeconds,
  initialScrollPct,
  children,
}: {
  chapterId: string;
  initialActiveSeconds: number;
  initialScrollPct: number;
  children: React.ReactNode;
}) {
  const state = useReadingTracker(
    chapterId,
    initialActiveSeconds,
    initialScrollPct,
  );
  return (
    <TrackerContext.Provider value={state}>{children}</TrackerContext.Provider>
  );
}

function format(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * The live indicator. Showing the paused state is the point of the whole
 * feature — a learner who switches tabs should see the clock visibly stop.
 */
export function LiveReadingTime({ estimatedMinutes }: { estimatedMinutes: number }) {
  const { activeSeconds, isActive } = useContext(TrackerContext);

  return (
    <span className="inline-flex items-center gap-2" aria-live="off">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${isActive ? "bg-success" : "bg-progress"}`}
      />
      <span className="tabular-nums">{format(activeSeconds)}</span>
      <span className="hidden sm:inline">
        {isActive ? "reading" : "paused"} · ~{estimatedMinutes} min
      </span>
    </span>
  );
}
