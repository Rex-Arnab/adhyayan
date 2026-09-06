"""Learns the ranking weights the TypeScript heuristic hand-tunes.

Evaluation is a TEMPORAL holdout, never a random split: recommendation is a
prediction about the future, and a random split lets the model see a learner's
later behaviour while scoring their earlier decisions. That inflates AUC into a
number which means nothing.

Three arms are always reported — random, the hand-tuned heuristic, and the
learned ranker — because "the model works" is only meaningful relative to the
baseline it is supposed to beat.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .features import FEATURE_NAMES

# Mirrors src/lib/reco/rank.ts. Kept here so the learned model is scored against
# the exact weights currently shipping, not an approximation of them.
HEURISTIC_WEIGHTS = {
    "continuity": 0.35,
    "tagAffinity": 0.25,
    "difficultyFit": 0.15,
    "effortFit": 0.10,
    "popularity": 0.10,
    "freshness": 0.05,
}


def heuristic_score(df: pd.DataFrame) -> np.ndarray:
    """Reconstructs the shipped heuristic from the same feature frame."""
    continuity = df["is_enrolled"] * df["unread_chapters"]
    popularity = df["popularity"] / max(df["popularity"].max(), 1e-9)
    return (
        HEURISTIC_WEIGHTS["continuity"] * continuity
        + HEURISTIC_WEIGHTS["tagAffinity"] * df["tag_affinity"]
        + HEURISTIC_WEIGHTS["difficultyFit"] * 1.0
        + HEURISTIC_WEIGHTS["effortFit"] * df["effort_fit"]
        + HEURISTIC_WEIGHTS["popularity"] * popularity
        + HEURISTIC_WEIGHTS["freshness"] * 0.5
    ).to_numpy()


def _dcg(relevances: list[int]) -> float:
    return sum(r / np.log2(i + 2) for i, r in enumerate(relevances))


def ndcg_at_k(df: pd.DataFrame, scores: np.ndarray, k: int = 3) -> float:
    """Mean NDCG@k over decision points (each is one ranking problem)."""
    frame = df.copy()
    frame["_score"] = scores
    values = []
    for _, group in frame.groupby(["user_id", "decision_at"]):
        if group["label"].sum() == 0:
            continue
        ranked = group.sort_values("_score", ascending=False)["label"].tolist()[:k]
        ideal = sorted(group["label"].tolist(), reverse=True)[:k]
        denom = _dcg(ideal)
        values.append(_dcg(ranked) / denom if denom > 0 else 0.0)
    return float(np.mean(values)) if values else 0.0


def precision_at_k(df: pd.DataFrame, scores: np.ndarray, k: int = 3) -> float:
    frame = df.copy()
    frame["_score"] = scores
    values = []
    for _, group in frame.groupby(["user_id", "decision_at"]):
        if group["label"].sum() == 0:
            continue
        top = group.sort_values("_score", ascending=False)["label"].tolist()[:k]
        values.append(sum(top) / min(k, len(top)))
    return float(np.mean(values)) if values else 0.0


def recall_at_k(df: pd.DataFrame, scores: np.ndarray, k: int = 3) -> float:
    frame = df.copy()
    frame["_score"] = scores
    values = []
    for _, group in frame.groupby(["user_id", "decision_at"]):
        total = group["label"].sum()
        if total == 0:
            continue
        top = group.sort_values("_score", ascending=False)["label"].tolist()[:k]
        values.append(sum(top) / total)
    return float(np.mean(values)) if values else 0.0


TRAIN_FRACTION = 0.7


def temporal_split(df: pd.DataFrame, train_fraction: float = TRAIN_FRACTION):
    """Split on decision time so the test set is strictly the future."""
    cutoff = df["decision_at"].quantile(train_fraction)
    return df[df["decision_at"] < cutoff].copy(), df[df["decision_at"] >= cutoff].copy(), cutoff


def evaluate(df: pd.DataFrame, scores: np.ndarray) -> dict:
    labels = df["label"].to_numpy()
    auc = float(roc_auc_score(labels, scores)) if len(set(labels)) > 1 else float("nan")
    return {
        "auc": round(auc, 4),
        "precision_at_3": round(precision_at_k(df, scores), 4),
        "recall_at_3": round(recall_at_k(df, scores), 4),
        "ndcg_at_3": round(ndcg_at_k(df, scores), 4),
    }


def train(df: pd.DataFrame, seed: int = 20260906) -> dict:
    train_df, test_df, cutoff = temporal_split(df)

    if train_df.empty or test_df.empty:
        raise RuntimeError("Not enough decision points to form a temporal split.")
    if train_df["label"].nunique() < 2:
        raise RuntimeError("Training split has a single class; cannot fit a ranker.")

    x_train = train_df[FEATURE_NAMES].to_numpy()
    y_train = train_df["label"].to_numpy()
    x_test = test_df[FEATURE_NAMES].to_numpy()

    logreg = Pipeline([
        ("scale", StandardScaler()),
        ("clf", LogisticRegression(
            max_iter=2000, class_weight="balanced", C=1.0, random_state=seed,
        )),
    ])
    logreg.fit(x_train, y_train)

    gbm = HistGradientBoostingClassifier(
        max_depth=4, learning_rate=0.08, max_iter=250,
        l2_regularization=1.0, random_state=seed,
    )
    gbm.fit(x_train, y_train)

    rng = np.random.default_rng(seed)
    arms = {
        "random": rng.random(len(test_df)),
        "heuristic": heuristic_score(test_df),
        "logreg": logreg.predict_proba(x_test)[:, 1],
        "gbm": gbm.predict_proba(x_test)[:, 1],
    }
    metrics = {name: evaluate(test_df, scores) for name, scores in arms.items()}

    coefs = logreg.named_steps["clf"].coef_[0]
    importances = sorted(
        ({"feature": f, "weight": round(float(w), 4)} for f, w in zip(FEATURE_NAMES, coefs)),
        key=lambda d: -abs(d["weight"]),
    )

    best = max(("logreg", "gbm"), key=lambda m: metrics[m]["ndcg_at_3"])

    return {
        "models": {"logreg": logreg, "gbm": gbm},
        "best_model": best,
        "metrics": metrics,
        "feature_importances": importances,
        "split": {
            "cutoff": str(cutoff),
            "train_rows": len(train_df),
            "test_rows": len(test_df),
            "train_positive_rate": round(float(train_df["label"].mean()), 4),
            "test_positive_rate": round(float(test_df["label"].mean()), 4),
        },
    }
