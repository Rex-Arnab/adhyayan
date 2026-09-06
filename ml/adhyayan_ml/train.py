"""Fits every model and writes artifacts + metrics.json.

Run:  uv run python -m adhyayan_ml.train
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib

import pandas as pd

from . import collab, content, extract
from .features import build_rows, session_decision_points
from .rank import TRAIN_FRACTION, train as train_ranker

ARTIFACTS = Path(__file__).resolve().parent.parent / "artifacts"


def main() -> None:
    ARTIFACTS.mkdir(exist_ok=True)
    data = extract.load()
    print("dataset:", json.dumps(data.summary()))

    print("\nfitting content model (TF-IDF)…")
    content_model = content.fit(data.courses, data.chapters)
    print(f"  vocabulary: {len(content_model.vectorizer.vocabulary_)} terms")

    print("building decision points…")
    points = session_decision_points(data)

    # The evaluation cutoff must be known BEFORE fitting the collaborative model:
    # an SVD fitted on the full interaction matrix encodes each learner's future
    # reading into their latent factor, which then "predicts" that same future.
    # Fitting strictly on pre-cutoff data is what makes the holdout honest.
    eval_cutoff = points["decision_at"].quantile(TRAIN_FRACTION)
    hist = data.progress.copy()
    hist["completed_at"] = pd.to_datetime(hist["completed_at"])
    past_progress = hist[hist["completed_at"].notna() & (hist["completed_at"] < eval_cutoff)]

    print(f"fitting collaborative model (TruncatedSVD) on pre-cutoff data only "
          f"({len(past_progress)} of {len(hist)} progress rows)…")
    collab_model = collab.fit(past_progress)
    print(f"  available={collab_model.available} "
          f"explained_variance={collab_model.explained_variance:.3f}")
    frame = build_rows(data, content_model, collab_model, points)
    print(f"  {len(frame)} rows across {frame['decision_at'].nunique()} decision points, "
          f"positive rate {frame['label'].mean():.3f}")

    print("training ranker (temporal holdout)…")
    result = train_ranker(frame)

    # For SERVING, refit collaborative filtering on everything — leakage only
    # matters when measuring, and stale factors would make live scores worse.
    serving_collab = collab.fit(data.progress)

    joblib.dump(
        {
            "content": content_model,
            "collab": serving_collab,
            "logreg": result["models"]["logreg"],
            "gbm": result["models"]["gbm"],
            "best_model": result["best_model"],
        },
        ARTIFACTS / "models.joblib",
    )

    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset": data.summary(),
        "content": {"vocabulary": len(content_model.vectorizer.vocabulary_)},
        "collab": {
            "available": collab_model.available,
            "explained_variance": round(collab_model.explained_variance, 4),
        },
        "split": result["split"],
        "metrics": result["metrics"],
        "best_model": result["best_model"],
        "feature_importances": result["feature_importances"],
    }
    (ARTIFACTS / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print("\n=== temporal holdout ===")
    print(f"train {result['split']['train_rows']} rows / test {result['split']['test_rows']} rows")
    header = f"{'arm':<12}{'AUC':>8}{'P@3':>8}{'R@3':>8}{'NDCG@3':>9}"
    print(header)
    print("-" * len(header))
    for arm, m in result["metrics"].items():
        print(f"{arm:<12}{m['auc']:>8}{m['precision_at_3']:>8}"
              f"{m['recall_at_3']:>8}{m['ndcg_at_3']:>9}")

    print("\ntop learned weights (logistic regression):")
    for row in result["feature_importances"][:8]:
        print(f"  {row['feature']:<28}{row['weight']:>8}")

    print(f"\nartifacts -> {ARTIFACTS}")


if __name__ == "__main__":
    main()
