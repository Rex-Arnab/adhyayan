# Adhyayan — Build TODO

Plan: `~/.claude/plans/capacity-connect-lite-generic-noodle.md`
Review STOP points: **M1**, **M4**, **M7**.

## Phase 1 — the journey

- [x] **M0** Scaffold, theme tokens, Prisma 7 wired, schema migrated
- [x] **M1** Auth: register / login / logout, JWT session, protected routes, `/dashboard` stub — **STOP**
- [ ] **M2** 29 markdown chapters, seed (+60 persona-driven learners), `/courses`, `/courses/[slug]`, enrol
- [ ] **M3** Learn page: markdown at 68ch, sidebar, prev/next, mark-complete, progress
- [ ] **M4** `useReadingTracker`, heartbeat/exit routes, sessions, event taxonomy — **STOP**
- [ ] **M5** Completion detection, certificate issue, PDF route, `/certificates/[serial]`
- [ ] **M6** Dashboard: stats, progress bars, session history, certificates
- [ ] **M7** Empty states, skeletons, dark mode, 375px, README, Docker Compose — **STOP**

## Phase 2 — the ML engine

- [ ] **M8** uv project, extract/features, TF-IDF content + SVD collab, heuristic cards
- [ ] **M9** Learned ranker (LR/GBM) + KMeans personas + dropout risk, `score.py`
- [ ] **M10** `/admin/insights`: funnel, CTR by source/variant, feature importances, metrics

## Branding

Name: **Adhyayan** (अध्ययन — Sanskrit, *dedicated study*). Tagline in use: **"Read deeply. Finish completely."**
Alternates: "Attention, well spent." · "Learn one thing, all the way through." (current hero headline)
· "Study that learns how you study." · "The discipline of going deeper."

## Known issues / deferred

- `npm audit`: 2 high advisories (`mysql2`, `deepmerge-ts`) are **dev-only transitive deps of the
  Prisma CLI**. `mysql2` is a driver we never load. Not in the runtime bundle. `npm audit fix --force`
  would downgrade Prisma to 6 — do not run it.
