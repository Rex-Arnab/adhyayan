import Link from "next/link";

/**
 * The three overlapping, tilted cards under the hero. Each states one part of
 * the product thesis, and each is a real link — the tilt is decoration, the card
 * is navigation.
 */
const PILLARS = [
  {
    href: "/courses",
    eyebrow: "Read",
    body: "Short, text-first chapters you can finish in one sitting. No videos to sit through, no filler.",
    surface: "bg-sky",
    rotate: "-3deg",
    lift: "sm:mt-10",
  },
  {
    href: "/register",
    eyebrow: "Measure",
    body: "Reading time counts only while you are genuinely on the page. Switch tabs and the clock stops.",
    surface: "bg-tangerine",
    rotate: "1deg",
    lift: "sm:mt-0",
  },
  {
    href: "/certificates",
    eyebrow: "Finish",
    body: "Complete every chapter to earn a certificate with a public, scannable verification link.",
    surface: "bg-lilac",
    rotate: "3deg",
    lift: "sm:mt-8",
  },
] as const;

export function PillarCards() {
  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-5 sm:grid-cols-3 sm:gap-4 sm:px-8">
      {PILLARS.map((pillar) => (
        <Link
          key={pillar.eyebrow}
          href={pillar.href}
          style={{ rotate: pillar.rotate }}
          className={`group block rounded-3xl p-7 text-deep transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:p-8 ${pillar.surface} ${pillar.lift}`}
        >
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-[2rem]">
            {pillar.eyebrow}
            <span aria-hidden className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1">
              ›
            </span>
          </h2>
          <p className="mt-3 text-[1.02rem] font-medium leading-snug text-deep/85">
            {pillar.body}
          </p>
        </Link>
      ))}
    </div>
  );
}
