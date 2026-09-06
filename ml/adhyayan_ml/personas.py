"""Learner segmentation (KMeans) and abandonment risk (RandomForest).

These do not produce recommendations. They answer two different questions the
dashboard and the insights page ask: what KIND of learner is this, and are they
about to drop the course they are on?
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

PROFILE_FEATURES = [
    "total_minutes",
    "sessions",
    "avg_session_minutes",
    "chapters_completed",
    "completion_rate",
    "reading_wpm",
    "avg_scroll",
]

# Named from the cluster centroids after fitting, not hard-assigned.
def _label_cluster(centroid: dict) -> str:
    if centroid["avg_session_minutes"] >= 18 and centroid["chapters_completed"] >= 8:
        return "binge reader"
    if centroid["reading_wpm"] >= 260:
        return "fast skimmer"
    if centroid["completion_rate"] >= 0.6:
        return "steady finisher"
    if centroid["chapters_completed"] <= 3:
        return "browser"
    return "casual reader"


def build_profiles(data) -> pd.DataFrame:
    prog = data.progress
    if prog.empty:
        return pd.DataFrame()

    done = prog[prog["status"] == "COMPLETED"]
    agg = prog.groupby("user_id").agg(
        total_seconds=("active_seconds", "sum"),
        avg_scroll=("max_scroll_pct", "mean"),
    )
    completed = done.groupby("user_id").size().rename("chapters_completed")
    words = done.groupby("user_id")["word_count"].sum().rename("words")
    read_secs = done.groupby("user_id")["active_seconds"].sum().rename("read_seconds")

    sess = data.sessions.groupby("user_id").agg(
        sessions=("session_id", "count"),
        session_seconds=("active_seconds", "sum"),
    )
    enr = data.enrollments.groupby("user_id").agg(
        enrollments=("enrollment_id", "count"),
        completed_courses=("status", lambda s: (s == "COMPLETED").sum()),
    )

    df = agg.join([completed, words, read_secs, sess, enr], how="left").fillna(0)
    df["total_minutes"] = df["total_seconds"] / 60.0
    df["avg_session_minutes"] = np.where(
        df["sessions"] > 0, df["session_seconds"] / df["sessions"] / 60.0, 0.0
    )
    df["completion_rate"] = np.where(
        df["enrollments"] > 0, df["completed_courses"] / df["enrollments"], 0.0
    )
    df["reading_wpm"] = np.where(
        df["read_seconds"] > 0, df["words"] / df["read_seconds"] * 60.0, 0.0
    )
    return df.reset_index()


def fit_personas(profiles: pd.DataFrame, k: int = 4, seed: int = 20260906):
    if len(profiles) < k * 2:
        return None, {}

    pipe = Pipeline([
        ("scale", StandardScaler()),
        ("km", KMeans(n_clusters=k, n_init=20, random_state=seed)),
    ])
    labels = pipe.fit_predict(profiles[PROFILE_FEATURES].to_numpy())

    scaler = pipe.named_steps["scale"]
    centres = scaler.inverse_transform(pipe.named_steps["km"].cluster_centers_)

    names: dict[int, str] = {}
    used: set[str] = set()
    for i, row in enumerate(centres):
        centroid = dict(zip(PROFILE_FEATURES, row))
        name = _label_cluster(centroid)
        # Two clusters can land on the same descriptor; keep them distinguishable.
        if name in used:
            name = f"{name} {i}"
        used.add(name)
        names[i] = name

    return pipe, {"labels": labels, "names": names, "centroids": centres.tolist()}


def fit_dropout_risk(data, profiles: pd.DataFrame, seed: int = 20260906):
    """P(this learner abandons a course they started).

    Positive = an ACTIVE enrolment untouched for 14+ days. Trained per learner,
    so a single serving score describes the learner, not the course.
    """
    enr = data.enrollments.copy()
    enr["last_seen_at"] = pd.to_datetime(enr["last_seen_at"])
    now = enr["last_seen_at"].max()

    stalled = enr[
        (enr["status"] == "ACTIVE")
        & ((now - enr["last_seen_at"]).dt.days >= 14)
    ]["user_id"].unique()

    y = profiles["user_id"].isin(stalled).astype(int).to_numpy()
    x = profiles[PROFILE_FEATURES].to_numpy()

    if len(set(y)) < 2 or y.sum() < 5:
        return None, {"trained": False, "reason": "too few abandonment examples"}

    clf = RandomForestClassifier(
        n_estimators=300, max_depth=6, class_weight="balanced",
        random_state=seed, n_jobs=-1,
    )
    folds = min(5, int(y.sum()), int((1 - y).sum()))
    scores = cross_val_score(clf, x, y, cv=folds, scoring="roc_auc")
    clf.fit(x, y)

    in_sample = float(roc_auc_score(y, clf.predict_proba(x)[:, 1]))
    return clf, {
        "trained": True,
        "positives": int(y.sum()),
        "n": int(len(y)),
        "cv_auc_mean": round(float(scores.mean()), 4),
        "cv_auc_std": round(float(scores.std()), 4),
        "in_sample_auc": round(in_sample, 4),
        "importances": sorted(
            ({"feature": f, "importance": round(float(i), 4)}
             for f, i in zip(PROFILE_FEATURES, clf.feature_importances_)),
            key=lambda d: -d["importance"],
        ),
    }


if __name__ == "__main__":
    import json
    from .extract import load

    data = load()
    profiles = build_profiles(data)
    print(f"profiles: {len(profiles)} learners")

    pipe, info = fit_personas(profiles)
    if pipe is not None:
        counts = pd.Series([info["names"][c] for c in info["labels"]]).value_counts()
        print("\npersonas:")
        for name, n in counts.items():
            print(f"  {name:<20} {n}")

    _, risk = fit_dropout_risk(data, profiles)
    print("\ndropout risk:", json.dumps(risk if not risk.get("trained") else
          {k: v for k, v in risk.items() if k != "importances"}, indent=2))
