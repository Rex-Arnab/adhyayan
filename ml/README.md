# Adhyayan ML engine

Batch recommendation pipeline. The web app **never calls this at request time** —
it reads the `Recommendation` table, so a dead model degrades to the TypeScript
heuristic with no user-visible error.

```bash
uv sync
uv run python -m adhyayan_ml.train    # fit models -> artifacts/
uv run python -m adhyayan_ml.score    # write Recommendation + MlProfile rows
uv run python -m adhyayan_ml.score --dry-run
```

| Module | Model | Purpose |
| --- | --- | --- |
| `content.py` | `TfidfVectorizer` + cosine | Course-to-course similarity from real chapter prose. Needs zero interaction data, so it answers cold start. |
| `collab.py` | `TruncatedSVD` | "Learners like you" from a log-scaled active-seconds matrix. Reports unavailable below 5 users or 10% explained variance. |
| `rank.py` | `LogisticRegression`, `HistGradientBoostingClassifier` | Learns the weights `src/lib/reco/rank.ts` hand-tunes. |
| `personas.py` | `KMeans`, `RandomForestClassifier` | Learner segments and abandonment risk -> `MlProfile`. |

## Evaluation discipline

- **Temporal holdout only.** Decision points are `SESSION_START` times; features
  use history strictly before that instant; the label is "completed a chapter of
  this course within 7 days". A random split would let the model see a learner's
  later behaviour while scoring their earlier decisions.
- **Collaborative filtering is fitted on pre-cutoff data for evaluation** and
  refitted on everything for serving. Fitting the SVD on the full matrix encodes
  each learner's future into their latent factor — that alone took logistic
  regression from a real 0.74 AUC to a meaningless 0.99.
- **Three arms are always reported** — random, heuristic, learned — because a
  model number means nothing without the baseline it must beat.

Current results live in `artifacts/metrics.json`.
