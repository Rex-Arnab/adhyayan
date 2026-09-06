# Adhyayan — Build TODO

Plan: `~/.claude/plans/capacity-connect-lite-generic-noodle.md`
Review STOP points: **M1**, **M4**, **M7**.

## Phase 1 — the journey

- [x] **M0** Scaffold, theme tokens, Prisma 7 wired, schema migrated
- [x] **M1** Auth: register / login / logout, JWT session, protected routes, `/dashboard` stub — **STOP**
- [x] **M2** 45 markdown chapters across 6 courses, seed (+60 persona-driven learners), `/courses`, `/courses/[slug]`, enrol
- [x] **M3** Learn page: markdown at 68ch, sidebar, prev/next, mark-complete, progress
- [x] **M4** `useReadingTracker`, heartbeat/exit routes, sessions, event taxonomy — **STOP**
- [x] **M5** Completion detection, certificate issue, PDF route, `/certificates/[serial]`
- [x] **M6** Dashboard: stats, progress bars, session history, certificates *(brought forward)*
- [x] **M7** Empty states, skeletons, dark mode, 375px, README, Docker Compose — **STOP**

## Phase 2 — the ML engine

- [x] **M8** heuristic recommender + cards, TF-IDF content, SVD collaborative
- [x] **M9** Learned ranker (LR/GBM) + KMeans personas + dropout risk, `score.py`
- [x] **M10** `/admin/insights`: funnel, CTR by source/variant, feature importances, metrics *(Highcharts)*

## Branding

Name: **Adhyayan** (अध्ययन — Sanskrit, *dedicated study*). Tagline in use: **"Read deeply. Finish completely."**
Alternates: "Attention, well spent." · "Learn one thing, all the way through." (current hero headline)
· "Study that learns how you study." · "The discipline of going deeper."

## Verification debt — CLEARED

- **Idle gate: PASS.** Re-run against the Docker stack with the tab genuinely visible + focused
  (verified at both ends, `TAB_HIDDEN` never fired): **44s counted over a 200s idle window**, with
  `IDLE_START` fired exactly once. Beats are 15s and the idle threshold is 60s, so exactly three
  beats land before the gate closes — ~45s is the correct expectation, not the ~60s originally
  written into the band. Paired with 195s counted over a 180s *active* read, the anti-inflation
  behaviour is proven in both directions.

## Data caveats on /admin/insights

- **CTR is computed on rows actually SHOWN**, not rows written. The batch scorer
  writes ~180 ML rows but only impressions counted; with a handful of
  impressions the A/B split is not yet statistically meaningful. It moves as
  soon as real dashboards are viewed.
- The funnel looks flattering (79% of registered completed a course) because it
  is dominated by seeded synthetic learners, who are deliberately more diligent
  than real ones.

## Known issues / deferred

- **Build warning (upstream, benign):** `jose` triggers "A Node.js API is used (CompressionStream)
  which is not supported in the Edge Runtime" via `next-auth`. It is a static import trace for
  compressed-JWE deflate; Auth.js never sets the `zip` header, so the path is unreachable at
  runtime. No clean fix without patching `node_modules`. Middleware works.
- **Stale JWT on reads:** mutations go through `requireUser()` (verifies the row exists), but read
  paths still log events optimistically. After re-seeding, a stale token shows a signed-in header
  while events fail-soft until re-login. Acceptable; documented rather than fixed.
- Seed emits 11 event types. The remaining taxonomy (`CHAPTER_EXIT`, `IDLE_*`, `TAB_*`,
  `CERTIFICATE_DOWNLOAD`, `RECOMMENDATION_*`) is live-interaction only and arrives with M4/M10 —
  deliberately not fabricated in the seed.

- `npm audit`: 2 high advisories (`mysql2`, `deepmerge-ts`) are **dev-only transitive deps of the
  Prisma CLI**. `mysql2` is a driver we never load. Not in the runtime bundle. `npm audit fix --force`
  would downgrade Prisma to 6 — do not run it.
