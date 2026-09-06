"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BEAT_MS = 15_000;
const IDLE_MS = 60_000;
/** Mirrors the server clamp: never credit more than this from a single tick. */
const MAX_TICK_SECONDS = 20;
const SCROLL_THROTTLE_MS = 500;

const ACTIVITY_EVENTS = ["mousemove", "keydown", "touchstart", "click", "wheel"] as const;

export type ReadingTrackerState = {
  /** Server-confirmed seconds plus locally accumulated ones, for live display. */
  activeSeconds: number;
  scrollPct: number;
  isActive: boolean;
};

function post(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  });
}

/**
 * Measures ATTENTION, not tab-open time.
 *
 * Three details are easy to skip and then impossible to debug:
 *  1. `unsent` is cleared only after the POST resolves — clearing it optimistically
 *     means a flaky network silently eats reading time.
 *  2. `pagehide`, not `beforeunload` — iOS Safari never fires the latter.
 *  3. `sendBeacon`, not `fetch`, on exit — a normal fetch is cancelled during
 *     navigation, so the final segment of every chapter would vanish.
 */
export function useReadingTracker(
  chapterId: string,
  initialActiveSeconds = 0,
  initialScrollPct = 0,
): ReadingTrackerState {
  const lastActivity = useRef(Date.now());
  const maxScroll = useRef(initialScrollPct);
  const unsent = useRef(0);
  const inFlight = useRef(false);
  const confirmed = useRef(initialActiveSeconds);
  const idleNotified = useRef(false);
  const lastTick = useRef(Date.now());

  const [state, setState] = useState<ReadingTrackerState>({
    activeSeconds: initialActiveSeconds,
    scrollPct: initialScrollPct,
    isActive: true,
  });

  const emit = useCallback(
    (type: string, metadata: Record<string, unknown> = {}) => {
      void post("/api/track/event", { type, chapterId, metadata }).catch(() => {});
    },
    [chapterId],
  );

  useEffect(() => {
    // Reset per chapter — a new chapter must never inherit the previous one's
    // unsent seconds or scroll depth.
    lastActivity.current = Date.now();
    maxScroll.current = initialScrollPct;
    unsent.current = 0;
    confirmed.current = initialActiveSeconds;
    idleNotified.current = false;
    lastTick.current = Date.now();

    const bump = () => {
      lastActivity.current = Date.now();
      if (idleNotified.current) {
        idleNotified.current = false;
        emit("IDLE_END");
      }
    };

    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      bump();
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => {
        scrollTimer = null;
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight;
        const pct =
          scrollable <= 0
            ? 100
            : Math.round(((doc.scrollTop + doc.clientHeight) / doc.scrollHeight) * 100);
        const next = Math.max(maxScroll.current, Math.min(100, pct));
        if (next > maxScroll.current) {
          maxScroll.current = next;
          setState((s) => ({ ...s, scrollPct: next }));
        }
      }, SCROLL_THROTTLE_MS);
    };

    const onVisibility = () => {
      emit(document.visibilityState === "visible" ? "TAB_VISIBLE" : "TAB_HIDDEN");
      if (document.visibilityState === "visible") bump();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    void post("/api/track/chapter-open", { chapterId }).catch(() => {});

    const interval = setInterval(() => {
      const now = Date.now();
      // Browsers throttle timers; a tick can land well after BEAT_MS. Credit the
      // time that actually elapsed rather than a flat interval, or every late
      // tick silently loses its excess. Clamped to match the server.
      const tickSeconds = Math.min((now - lastTick.current) / 1000, MAX_TICK_SECONDS);
      lastTick.current = now;

      const idleFor = now - lastActivity.current;
      const active =
        document.visibilityState === "visible" &&
        document.hasFocus() &&
        idleFor < IDLE_MS;

      setState((s) => (s.isActive === active ? s : { ...s, isActive: active }));

      if (!active) {
        if (!idleNotified.current && idleFor >= IDLE_MS) {
          idleNotified.current = true;
          emit("IDLE_START", { idleForMs: idleFor });
        }
        return;
      }

      unsent.current += tickSeconds;
      setState((s) => ({ ...s, activeSeconds: confirmed.current + unsent.current }));

      if (inFlight.current) return;
      inFlight.current = true;

      const sending = Math.min(unsent.current, MAX_TICK_SECONDS);
      post("/api/track/heartbeat", {
        chapterId,
        deltaSeconds: sending,
        scrollPct: maxScroll.current,
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json().catch(() => null)) as
            | { activeSeconds?: number; ignored?: string }
            | null;
          if (data?.ignored) return;
          // Only now is it safe to forget these seconds.
          unsent.current = Math.max(0, unsent.current - sending);
          if (typeof data?.activeSeconds === "number") {
            confirmed.current = data.activeSeconds;
            setState((s) => ({
              ...s,
              activeSeconds: confirmed.current + unsent.current,
            }));
          }
        })
        .catch(() => {})
        .finally(() => {
          inFlight.current = false;
        });
    }, BEAT_MS);

    const flush = () => {
      if (unsent.current <= 0) return;
      const payload = JSON.stringify({
        chapterId,
        deltaSeconds: unsent.current,
        scrollPct: maxScroll.current,
      });
      // sendBeacon survives teardown; fetch does not.
      navigator.sendBeacon(
        "/api/track/chapter-exit",
        new Blob([payload], { type: "application/json" }),
      );
      unsent.current = 0;
    };

    // pagehide, not beforeunload: iOS Safari never fires beforeunload.
    window.addEventListener("pagehide", flush);

    return () => {
      flush();
      clearInterval(interval);
      if (scrollTimer) clearTimeout(scrollTimer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump));
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [chapterId, initialActiveSeconds, initialScrollPct, emit]);

  return state;
}
