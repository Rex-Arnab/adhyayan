import Link from "next/link";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ConfettiField } from "@/components/marketing/confetti";
import { PillarCards } from "@/components/marketing/pillar-cards";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/** Where a signed-in learner should actually go: the next unread chapter. */
async function resumeTarget(userId: string) {
  const enrollment = await db.enrollment.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { lastSeenAt: "desc" },
    select: {
      course: {
        select: {
          slug: true,
          title: true,
          chapters: { orderBy: { order: "asc" }, select: { id: true, slug: true } },
        },
      },
      chapters: { select: { chapterId: true, status: true } },
    },
  });
  if (!enrollment) return null;

  const done = new Set(
    enrollment.chapters.filter((c) => c.status === "COMPLETED").map((c) => c.chapterId),
  );
  const next = enrollment.course.chapters.find((c) => !done.has(c.id));
  return next
    ? { href: `/learn/${enrollment.course.slug}/${next.slug}`, title: enrollment.course.title }
    : null;
}

export default async function HomePage() {
  // A signed-in visitor must never be pushed at "Start learning free" -> /register.
  const session = await auth();
  const resume = session?.user?.id ? await resumeTarget(session.user.id) : null;

  const cta = session?.user
    ? resume
      ? { href: resume.href, label: "Continue learning" }
      : { href: "/courses", label: "Browse courses" }
    : { href: "/register", label: "Start learning free" };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />

      {/* Hero + cards share one stacking context so the arc can sit behind both. */}
      <main className="relative flex-1">
        <section className="relative overflow-hidden pb-40 pt-12 sm:pb-56 sm:pt-16">
          <ConfettiField />

          <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
            <h1 className="text-balance text-[2.6rem] font-extrabold leading-[1.03] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Learn one thing, all the way through.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl">
              Short written courses that measure real attention — not tab-open
              time — so we can tell you exactly what to read next.
            </p>

            <div className="mt-10">
              <Link
                href={cta.href}
                className="inline-block rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                {cta.label}
              </Link>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {resume
                  ? `Picking up ${resume.title}.`
                  : session?.user
                    ? "Six courses, forty-five chapters."
                    : "No card required. Six courses, forty-five chapters."}
              </p>
            </div>
          </div>

          {/* The arc: a wide ellipse cresting from below in card colour, so the
              cards straddle the boundary the way the reference does. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[-22%] bottom-[-14rem] h-[30rem] rounded-[50%] bg-card"
          />

          <div className="relative z-10 mt-20 sm:mt-28">
            <PillarCards signedIn={Boolean(session?.user)} />
          </div>
        </section>

        <section className="bg-card pb-24 pt-8">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="rounded-3xl bg-deep px-7 py-12 text-cream sm:px-14 sm:py-16">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky">
                Why it is different
              </p>
              <h2 className="mt-4 max-w-2xl text-balance text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl">
                Most platforms count minutes. We count attention.
              </h2>
              <p className="mt-5 max-w-2xl text-pretty text-lg font-medium leading-relaxed text-white/70">
                Open a tab and walk away and most tools will happily record ninety
                minutes of &ldquo;learning&rdquo;. Adhyayan only counts a second when the page
                is visible, focused, and you have moved in the last minute — which
                is what makes the recommendations worth trusting.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
