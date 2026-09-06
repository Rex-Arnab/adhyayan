import { cn } from "@/lib/utils";

/**
 * Decorative geometry for the marketing pages.
 *
 * Every shape is purely presentational: `aria-hidden`, no text, no focus target.
 * Shapes are positioned by the caller so they can be tuned per breakpoint.
 */
export type ShapeKind = "blob" | "triangle" | "heptagon" | "fan" | "pebble";

const CLIP: Record<ShapeKind, string> = {
  blob: "",
  pebble: "",
  triangle: "polygon(50% 4%, 96% 92%, 4% 92%)",
  heptagon:
    "polygon(50% 0%, 90% 20%, 100% 60%, 75% 96%, 25% 96%, 0% 60%, 10% 20%)",
  fan: "",
};

const RADIUS: Partial<Record<ShapeKind, string>> = {
  blob: "42% 58% 62% 38% / 46% 44% 56% 54%",
  pebble: "58% 42% 38% 62% / 52% 60% 40% 48%",
  fan: "100% 8% 8% 8%",
};

export function Shape({
  kind,
  className,
  rotate = 0,
}: {
  kind: ShapeKind;
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute block", className)}
      style={{
        clipPath: CLIP[kind] || undefined,
        borderRadius: RADIUS[kind],
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    />
  );
}

/**
 * The scattered field behind the hero. Hidden below `sm` so small screens get a
 * clean, uncluttered hero rather than shapes colliding with the headline.
 */
export function ConfettiField() {
  return (
    <div aria-hidden className="absolute inset-0 hidden overflow-hidden sm:block">
      {/* Positions hug the outer margins so nothing can collide with the
          centred headline column. Verified by bounding-box intersection. */}
      <Shape kind="blob" className="left-[3%] top-[15%] size-24 bg-tangerine lg:size-28" />
      <Shape kind="fan" className="left-[-1%] top-[52%] size-28 bg-tangerine" rotate={-18} />
      <Shape kind="heptagon" className="left-[15%] top-[45%] size-20 bg-sky lg:size-24" />
      <Shape kind="triangle" className="right-[12%] top-[1%] size-24 bg-tangerine lg:size-28" rotate={14} />
      <Shape kind="pebble" className="right-[3%] top-[21%] size-20 bg-sky lg:size-24" />
      <Shape kind="fan" className="right-[8%] top-[45%] size-24 bg-lilac" rotate={128} />
      <Shape kind="heptagon" className="right-[3%] top-[60%] size-16 bg-lilac" rotate={-12} />
      <Shape kind="pebble" className="left-[4%] top-[68%] size-14 bg-lilac" />
    </div>
  );
}
