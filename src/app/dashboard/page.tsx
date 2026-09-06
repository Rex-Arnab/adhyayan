import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Clock } from "lucide-react";

import { auth } from "@/auth";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { ProgressRing } from "@/components/learn/progress-ring";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { formatMinutes } from "@/lib/reading";
import {
  getRecommendations,
  markRecommendationsShown,
} from "@/lib/reco/service";
import { getLearnerStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");
  const userId = session.user.id;

  const [stats, recommendations, enrollments, sessions, certificates] =
    await Promise.all([
      getLearnerStats(userId),
      getRecommendations(userId),
      db.enrollment.findMany({
        where: { userId },
        orderBy: [{ status: "asc" }, { lastSeenAt: "desc" }],
        select: {
          id: true, status: true, progressPct: true, lastSeenAt: true,
          course: {
            select: {
              slug: true, title: true, coverEmoji: true,
              chapters: { orderBy: { order: "asc" }, select: { id: true, slug: true, title: true } },
            },
          },
          chapters: { select: { chapterId: true, status: true, activeSeconds: true } },
        },
      }),
      db.learningSession.findMany({
        where: { userId, activeSeconds: { gt: 0 } },
        orderBy: { startedAt: "desc" },
        take: 8,
        select: {
          id: true, startedAt: true, activeSeconds: true,
          chaptersVisited: true, chaptersCompleted: true,
        },
      }),
      db.certificate.findMany({
        where: { enrollment: { userId } },
        orderBy: { issuedAt: "desc" },
        select: { id: true, serial: true, courseTitle: true, issuedAt: true },
      }),
    ]);

  await markRecommendationsShown(userId, recommendations.map((r) => r.id));

  const active = enrollments.filter((e) => e.status !== "COMPLETED");
  const done = enrollments.filter((e) => e.status === "COMPLETED");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
        <h1 className="text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          {session.user.name?.split(" ")[0] ?? "Your"} dashboard
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Every number here comes from what you actually read.
        </p>

        {/* ---------- Stats ---------- */}
        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            surface="bg-sky"
            label="Time read"
            value={formatMinutes(stats.totalActiveMinutes)}
            hint={
              stats.readingWpm
                ? `About ${stats.readingWpm} words per minute`
                : "Attention, not tab-open time"
            }
          />
          <StatTile
            surface="bg-tangerine"
            label="Chapters"
            value={String(stats.chaptersCompleted)}
            hint={`${stats.coursesCompleted} course${stats.coursesCompleted === 1 ? "" : "s"} finished`}
          />
          <StatTile
            surface="bg-lilac"
            label="Streak"
            value={`${stats.currentStreakDays} day${stats.currentStreakDays === 1 ? "" : "s"}`}
            hint={`${stats.sessionCount} sessions, avg ${stats.avgSessionMinutes} min`}
          />
          <StatTile
            surface="bg-sky"
            label="Certificates"
            value={String(stats.certificates)}
            hint={stats.certificates > 0 ? "Publicly verifiable" : "Finish a course to earn one"}
          />
        </section>

        {/* ---------- Recommendations ---------- */}
        <section className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
              Recommended next
            </h2>
            <p className="text-sm font-medium text-muted-foreground">
              Chosen from your reading time, pace and finished courses
            </p>
          </div>

          {recommendations.length === 0 ? (
            <EmptyState
              title="Nothing to recommend yet"
              body="Enrol in a course and read a chapter — recommendations appear as soon as there is something to learn from."
              href="/courses"
              cta="Browse courses"
            />
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((card, i) => (
                <RecommendationCard key={card.id} card={card} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* ---------- In progress ---------- */}
        <section className="mt-14">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
            Continue learning
          </h2>

          {active.length === 0 ? (
            <EmptyState
              title="No courses in progress"
              body="You are all caught up. Pick something new to start."
              href="/courses"
              cta="Browse courses"
            />
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {active.map((e) => {
                const doneIds = new Set(
                  e.chapters.filter((c) => c.status === "COMPLETED").map((c) => c.chapterId),
                );
                const next = e.course.chapters.find((c) => !doneIds.has(c.id));
                const minutes = Math.round(
                  e.chapters.reduce((s, c) => s + c.activeSeconds, 0) / 60,
                );

                return (
                  <li key={e.id}>
                    <Link
                      href={next ? `/learn/${e.course.slug}/${next.slug}` : `/courses/${e.course.slug}`}
                      className="flex items-start gap-4 rounded-3xl border bg-card p-5 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                    >
                      <ProgressRing value={e.progressPct} size={52} />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold tracking-[-0.02em]">
                          <span aria-hidden className="mr-1.5">{e.course.coverEmoji}</span>
                          {e.course.title}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {next ? `Next: ${next.title}` : "All chapters read"}
                        </p>
                        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <Clock className="size-3.5" aria-hidden />
                          {minutes} min read · {doneIds.size}/{e.course.chapters.length} chapters
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------- Sessions + certificates ---------- */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <section>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
              Recent sessions
            </h2>
            {sessions.length === 0 ? (
              <p className="mt-4 text-muted-foreground">
                No study sessions recorded yet.
              </p>
            ) : (
              <ul className="mt-5 divide-y rounded-3xl border bg-card">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
                  >
                    <span className="font-semibold">
                      {s.startedAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.max(1, Math.round(s.activeSeconds / 60))} min ·{" "}
                      {s.chaptersVisited} chapter{s.chaptersVisited === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
              Certificates
            </h2>
            {certificates.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Finish every chapter of a course to earn one.
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {certificates.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/certificates/${c.serial}`}
                      className="flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors duration-150 hover:bg-muted/60"
                    >
                      <Award className="mt-0.5 size-5 shrink-0 text-progress" aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">
                          {c.courseTitle}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {c.serial}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {done.length > 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {done.length} course{done.length === 1 ? "" : "s"} completed.
              </p>
            ) : null}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function EmptyState({
  title, body, href, cta,
}: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed p-10 text-center">
      <p className="text-lg font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{body}</p>
      <Link
        href={href}
        className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85"
      >
        {cta}
      </Link>
    </div>
  );
}
