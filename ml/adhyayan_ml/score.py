"""Scores every learner and writes cached recommendations + ML profiles.

This is the ONLY module that writes. It touches exactly two tables —
Recommendation and MlProfile — and never the learning data it reads.

Run:  uv run python -m adhyayan_ml.score
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd

from . import extract, personas
from .db import connect
from .features import FEATURE_NAMES, build_rows
from .rank import heuristic_score

ARTIFACTS = Path(__file__).resolve().parent.parent / "artifacts"
TOP_N = 3


def model_version() -> str:
    """Hash of the artifact file, so a stale recommendation is identifiable."""
    blob = (ARTIFACTS / "models.joblib").read_bytes()
    return "ml-" + hashlib.sha256(blob).hexdigest()[:12]


def _reason(row: pd.Series, course_title: str, chapter_title: str | None) -> str:
    """Grounded in the feature that actually drove the score."""
    if row["is_enrolled"] > 0 and row["progress_pct"] > 0:
        return (
            f"You are {int(row['progress_pct'] * 100)}% through {course_title} — "
            f"{chapter_title or 'the next chapter'} is next."
        )
    if row["is_enrolled"] > 0:
        return f"You enrolled in {course_title} but have not opened it yet."
    if row["cf_score"] >= 0.6:
        return "Learners with reading patterns like yours take this next."
    if row["content_sim"] >= 0.08:
        return f"{course_title} covers material close to what you have been reading."
    if row["tag_affinity"] >= 0.5:
        return f"Builds on the topics you spend most of your reading time on."
    return f"A good next step given your pace and finished courses."


def main(dry_run: bool = False) -> None:
    if not (ARTIFACTS / "models.joblib").exists():
        raise SystemExit("No artifacts. Run `uv run python -m adhyayan_ml.train` first.")

    bundle = joblib.load(ARTIFACTS / "models.joblib")
    model = bundle[bundle["best_model"]]
    version = model_version()

    data = extract.load()
    courses = data.courses.set_index("course_id")
    chapters = data.chapters.sort_values("chapter_order")

    # Score every learner as of NOW.
    now = pd.Timestamp(datetime.now())
    users = sorted(set(data.enrollments["user_id"]))
    points = pd.DataFrame({"user_id": users, "decision_at": [now] * len(users)})

    frame = build_rows(data, bundle["content"], bundle["collab"], points)
    if frame.empty:
        print("no scorable learners")
        return

    frame["ml_score"] = model.predict_proba(frame[FEATURE_NAMES].to_numpy())[:, 1]
    frame["heuristic"] = heuristic_score(frame)

    # Progress rows tell us which chapter to deep-link to.
    done = data.progress[data.progress["status"] == "COMPLETED"]
    done_by = done.groupby(["user_id", "course_id"])["chapter_id"].apply(set).to_dict()

    recommendations: list[tuple] = []
    for user_id, group in frame.groupby("user_id"):
        top = group.sort_values("ml_score", ascending=False).head(TOP_N)
        for rank, (_, row) in enumerate(top.iterrows(), start=1):
            cid = row["course_id"]
            seen = done_by.get((user_id, cid), set())
            nxt = chapters[
                (chapters["course_id"] == cid) & (~chapters["chapter_id"].isin(seen))
            ]
            chapter_id = nxt["chapter_id"].iloc[0] if len(nxt) else None
            chapter_title = nxt["chapter_title"].iloc[0] if len(nxt) else None

            recommendations.append((
                user_id, cid, chapter_id,
                float(row["ml_score"]),
                _reason(row, courses.loc[cid, "course_title"], chapter_title),
                "ML_RANKER", rank, version,
                json.dumps({
                    "features": {f: float(row[f]) for f in FEATURE_NAMES},
                    "mlScore": float(row["ml_score"]),
                    "heuristicScore": float(row["heuristic"]),
                    "model": bundle["best_model"],
                }),
                "ML",
            ))

    profiles = personas.build_profiles(data)
    pipe, info = personas.fit_personas(profiles)
    risk_clf, _ = personas.fit_dropout_risk(data, profiles)

    ml_profiles: list[tuple] = []
    if pipe is not None and len(profiles):
        labels = info["labels"]
        risks = (
            risk_clf.predict_proba(profiles[personas.PROFILE_FEATURES].to_numpy())[:, 1]
            if risk_clf is not None
            else [None] * len(profiles)
        )
        for i, (_, prof) in enumerate(profiles.iterrows()):
            ml_profiles.append((
                prof["user_id"], info["names"][labels[i]], int(labels[i]),
                float(risks[i]) if risks[i] is not None else None,
                float(prof["reading_wpm"]), version,
            ))

    print(f"scored {frame['user_id'].nunique()} learners -> "
          f"{len(recommendations)} recommendations, {len(ml_profiles)} profiles")
    print(f"model={bundle['best_model']} version={version}")

    if dry_run:
        print("\n--dry-run: nothing written")
        for r in recommendations[:6]:
            print(f"  {r[0][:12]:<14} rank {r[6]}  {r[3]:.4f}  {r[4]}")
        return

    with connect() as conn, conn.cursor() as cur:
        # Replace only ML rows; a heuristic row written by the app stays until
        # the app itself refreshes it.
        cur.execute("""delete from "Recommendation" where source = 'ML_RANKER'""")
        cur.executemany(
            """
            insert into "Recommendation"
              (id, "userId", "courseId", "chapterId", score, reason, source, rank,
               "generatedAt", "modelVersion", features, variant)
            values (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, now(), %s, %s::jsonb, %s)
            """,
            recommendations,
        )
        cur.executemany(
            """
            insert into "MlProfile"
              ("userId", persona, "personaId", "dropoutRisk", "readingWpm", "computedAt", "modelVersion")
            values (%s, %s, %s, %s, %s, now(), %s)
            on conflict ("userId") do update set
              persona = excluded.persona,
              "personaId" = excluded."personaId",
              "dropoutRisk" = excluded."dropoutRisk",
              "readingWpm" = excluded."readingWpm",
              "computedAt" = excluded."computedAt",
              "modelVersion" = excluded."modelVersion"
            """,
            ml_profiles,
        )
        conn.commit()

    print(f"written at {datetime.now(timezone.utc).isoformat()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    main(**vars(parser.parse_args()))
