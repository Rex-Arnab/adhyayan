# Adhyayan

**Read deeply. Finish completely.**

A text-first learning platform built to prove one thing: that a complete student
journey — discover → enrol → learn → certify — can be instrumented thoroughly
enough that a model picks the learner's next lesson better than the learner does.

The differentiator is that reading time measures **attention, not tab-open time**.
A tab left open on a chapter accrues nothing.

---

## Quick start

Requires Node 24, Postgres 17, and (for the ML engine) Python 3.13 + [uv](https://docs.astral.sh/uv/).

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL and AUTH_SECRET
npx auth secret               # generates AUTH_SECRET

createdb adhyayan
npx prisma migrate dev        # create the schema
npm run db:seed               # restores the committed snapshot (Prisma 7 does not auto-seed)

npm run dev                   # http://localhost:3000
```

### Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@demo.com` | `demo1234` |
| Admin | `admin@demo.com` | `demo1234` |

The admin account unlocks `/admin/insights`. A student hitting that route gets a
404, not a 403 — the page should not announce itself.

### Seed data

Seeding restores a **committed snapshot of a known-good database** —
`prisma/fixtures/snapshot.json.gz` (240 KB) — so a fresh install is a complete,
populated platform rather than an empty shell:

| | |
| --- | --- |
| 62 learners across 8 behavioural personas | 6 courses, 45 chapters |
| 122 enrolments, 655 chapter-progress rows | 7,174 events |
| 68 certificates | **191 recommendations + 61 ML profiles** |

Because the ML output is included, the dashboard shows model-ranked
recommendations and `/admin/insights` shows real metrics **without running the
Python pipeline at all**.

Two details that matter:

- **Chapter markdown is not in the fixture.** `prisma/content/*.md` stays the
  single source of truth and is re-read on restore, so the two cannot drift.
- **Timestamps are re-based on restore.** Every date is shifted forward by the
  fixture's age, so a months-old snapshot still yields live streaks and a
  populated events-per-day chart instead of looking abandoned.

| Command | Effect |
| --- | --- |
| `npm run db:seed` | Restore the snapshot — **skips if the database already has data** |
| `npm run db:reseed` | `FORCE_SEED=1` — wipe and restore |
| `npm run db:seed:generate` | Ignore the fixture and generate fresh synthetic data |
| `npm run db:snapshot` | Export the current database to a new fixture |

To capture your own state as the new baseline: `npm run db:snapshot`, then commit
`prisma/fixtures/snapshot.json.gz`.

---

## Docker

```bash
echo "AUTH_SECRET=$(npx auth secret --raw 2>/dev/null || openssl rand -base64 32)" >> .env
docker compose up --build          # db + migrate + seed + web  ->  localhost:3000
docker compose run --rm ml         # train the models and write recommendations
```

On first start the stack migrates and restores the snapshot automatically. On
every later start it detects the existing data and **skips seeding**, so a
restart never destroys accounts you created. `FORCE_SEED=1` re-seeds
deliberately.

Postgres is published on host port **5433** so it cannot collide with a local
Postgres on 5432. Every image tag is pinned.

---

## The ML engine

Python lives in [`ml/`](ml/README.md) and runs as a **batch job**. The request path
never calls it: the app reads the `Recommendation` table, so a dead model degrades
to the TypeScript heuristic with no user-visible error. That fallback is tested by
deleting the artifacts and reloading.

```bash
cd ml
uv sync
uv run python -m adhyayan_ml.train   # fit -> artifacts/
uv run python -m adhyayan_ml.score   # write Recommendation + MlProfile
```

Four models: TF-IDF course similarity, TruncatedSVD collaborative filtering, a
LogisticRegression/GradientBoosting ranker, and KMeans personas + RandomForest
dropout risk. Results are on `/admin/insights`.

**Current honest result** (temporal holdout, 442 test rows):

| Arm | AUC | NDCG@3 |
| --- | --- | --- |
| Random | 0.578 | 0.442 |
| Heuristic (shipped) | 0.895 | 0.894 |
| Logistic regression | 0.738 | 0.835 |
| Gradient boosting | 0.869 | **0.938** |

The learned ranker beats the hand-tuned heuristic on NDCG@3 but **loses on AUC**.
Reported as measured rather than tuned until it looked better. See
[`ml/README.md`](ml/README.md) for the leakage audit that produced these numbers —
an earlier run scored 0.99 AUC purely from three leaks.

---

## How attention is measured

Naive tracking (`endTime - startTime`) reports 90 minutes of "reading" for a
learner who opened a tab and went to lunch. Instead:

- A beat fires every 15s, and only when the page is **visible**, **focused**, and
  has seen input in the last 60s.
- Each beat credits the time that **actually elapsed**, not a flat interval —
  browsers throttle timers, and a flat interval silently loses the excess.
- The server clamps every beat to **20 seconds** and rejects beats less than 5s
  apart. A client cannot inflate its own time.
- Exit uses `pagehide` + `navigator.sendBeacon`, not `beforeunload` + `fetch` —
  the latter is cancelled during navigation and loses the last segment of every
  chapter.

Measured end to end: a 3-minute read records **195s of 180s wall clock**; an
occluded window records **75s of 180s**.

---

## Layout

```
src/
  app/            routes (App Router)
  components/     UI, learn/, dashboard/, insights/, marketing/
  hooks/          use-reading-tracker.ts   <- the attention measurement
  lib/            db, auth, events, progress, tracking, certificate, reco/
prisma/
  schema.prisma   10 models
  content/        45 chapters of markdown, read by the seed
  seed/           catalogue, personas, synthetic history
ml/               the scikit-learn pipeline
```

Project conventions and stack landmines are in [`CLAUDE.md`](CLAUDE.md); milestone
status and open verification debt are in [`TODO.md`](TODO.md).

---

## Commands

```bash
npm run dev                    # dev server
npm run build                  # production build  (stop `next dev` first — both write .next)
npx tsc --noEmit               # typecheck
npx prisma studio              # inspect the database
npx prisma db seed             # re-seed
```
