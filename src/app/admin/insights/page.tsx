import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  CtrChart,
  EngagementChart,
  EventsChart,
  FeatureWeightChart,
  FunnelChart,
  SessionDistributionChart,
} from "@/components/insights/charts";
import { ChartCard } from "@/components/insights/chart";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getChapterEngagement,
  getCtrBySource,
  getCtrByVariant,
  getEventsPerDay,
  getFunnel,
  getPersonaBreakdown,
  getSessionDistribution,
  readModelMetrics,
} from "@/lib/insights";

export const metadata: Metadata = { title: "Insights" };

const ARM_LABEL: Record<string, string> = {
  random: "Random",
  heuristic: "Heuristic (shipped)",
  logreg: "Logistic regression",
  gbm: "Gradient boosting",
};

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/insights");
  // A STUDENT should not learn that this route exists.
  if (session.user.role !== "ADMIN") notFound();

  const [
    funnel, ctrSource, ctrVariant, events, engagement, personas, sessions, model,
  ] = await Promise.all([
    getFunnel(), getCtrBySource(), getCtrByVariant(), getEventsPerDay(),
    getChapterEngagement(), getPersonaBreakdown(), getSessionDistribution(),
    readModelMetrics(),
  ]);

  const overallShown = ctrSource.reduce((s, r) => s + r.shown, 0);
  const overallClicked = ctrSource.reduce((s, r) => s + r.clicked, 0);
  const overallCtr =
    overallShown === 0 ? 0 : Math.round((overallClicked / overallShown) * 1000) / 10;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
        <h1 className="text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          Insights
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Click-through is the number that proves the recommender changes
          behaviour. Everything else is context for it.
        </p>

        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Headline label="Recommendation CTR" value={`${overallCtr}%`}
            hint={`${overallClicked} clicks of ${overallShown} shown`} surface="bg-tangerine" />
          <Headline label="Funnel top" value={String(funnel[0]?.users ?? 0)}
            hint="registered learners" surface="bg-sky" />
          <Headline
            label="Completed a course"
            value={String(funnel[3]?.users ?? 0)}
            hint={
              funnel[0]?.users
                ? `${Math.round(((funnel[3]?.users ?? 0) / funnel[0].users) * 100)}% of registered`
                : "—"
            }
            surface="bg-lilac"
          />
        </section>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="Acquisition funnel" hint="Distinct learners reaching each stage">
            <FunnelChart data={funnel} />
          </ChartCard>

          <ChartCard title="CTR by recommendation source" hint="Which engine produced the card">
            {ctrSource.length ? (
              <CtrChart data={ctrSource} label="source" />
            ) : (
              <Empty>No recommendations have been shown yet.</Empty>
            )}
          </ChartCard>

          <ChartCard title="CTR by A/B variant" hint="Learners split deterministically by user id">
            {ctrVariant.length ? (
              <CtrChart data={ctrVariant} label="variant" />
            ) : (
              <Empty>No variant data yet.</Empty>
            )}
          </ChartCard>

          <ChartCard title="Chapters per session" hint="How much is read in one sitting">
            <SessionDistributionChart data={sessions} />
          </ChartCard>

          <ChartCard title="Events per day" hint="Heartbeats excluded — they dwarf everything else">
            <EventsChart data={events} />
          </ChartCard>

          <ChartCard title="Average reading time per chapter" hint="Measured attention, not tab-open time">
            <EngagementChart data={engagement} />
          </ChartCard>
        </div>

        {/* ---------- Model ---------- */}
        <h2 className="mt-14 text-2xl font-extrabold tracking-[-0.03em]">
          Recommendation model
        </h2>

        {!model ? (
          <div className="mt-5 rounded-3xl border border-dashed p-10 text-center">
            <p className="text-lg font-bold">The ML pipeline has not run</p>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Recommendations are being served by the TypeScript heuristic. Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                uv run python -m adhyayan_ml.train
              </code>{" "}
              in <code className="rounded bg-muted px-1.5 py-0.5 text-sm">ml/</code> to populate this.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-3 text-muted-foreground">
              Temporal holdout — trained on {model.split.train_rows} decision rows,
              tested on {model.split.test_rows} strictly later ones
              ({Math.round(model.split.test_positive_rate * 1000) / 10}% positive).
              Best arm: <strong className="text-foreground">{ARM_LABEL[model.best_model] ?? model.best_model}</strong>.
            </p>

            <div className="mt-5 overflow-x-auto rounded-3xl border bg-card">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    {["Arm", "AUC", "P@3", "R@3", "NDCG@3"].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(model.metrics).map(([arm, m]) => (
                    <tr key={arm} className="border-b last:border-0">
                      <td className="px-5 py-3 font-semibold">{ARM_LABEL[arm] ?? arm}</td>
                      <td className="px-5 py-3 tabular-nums">{m.auc}</td>
                      <td className="px-5 py-3 tabular-nums">{m.precision_at_3}</td>
                      <td className="px-5 py-3 tabular-nums">{m.recall_at_3}</td>
                      <td className="px-5 py-3 font-bold tabular-nums">{m.ndcg_at_3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartCard
                title="Learned feature weights"
                hint="Logistic regression coefficients. Negative pushes a candidate down."
              >
                <FeatureWeightChart data={model.feature_importances} />
              </ChartCard>

              <ChartCard title="Learner personas" hint="KMeans clusters, with modelled abandonment risk">
                {personas.length ? (
                  <ul className="divide-y">
                    {personas.map((p) => (
                      <li key={p.persona} className="flex items-center justify-between gap-4 py-3">
                        <span className="font-semibold capitalize">{p.persona}</span>
                        <span className="text-sm text-muted-foreground">
                          {p.learners} learners · {p.avgWpm} wpm ·{" "}
                          {Math.round(p.avgDropoutRisk * 100)}% risk
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>No ML profiles yet. Run the scorer.</Empty>
                )}
              </ChartCard>
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function Headline({
  label, value, hint, surface,
}: { label: string; value: string; hint: string; surface: string }) {
  return (
    <div className={`rounded-3xl p-6 text-deep ${surface}`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-4xl font-extrabold tracking-[-0.04em] tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium opacity-75">{hint}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>
  );
}
