"""Builds the (learner, candidate-course, decision-time) training matrix.

Decision points are SESSION_START times: the moment a learner would actually see
recommendations. For each one we describe the catalogue using ONLY history
strictly before that instant, and label a course positive if the learner
completed a chapter of it within the next 7 days.

Every feature is computed from a `history_cutoff`. Nothing may read a row
timestamped at or after the decision point — that is the whole discipline here,
and getting it wrong inflates AUC into a number that means nothing.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

HORIZON_DAYS = 7

FEATURE_NAMES = [
    "prior_seconds_on_course",
    "prior_chapters_done",
    "is_enrolled",
    "progress_pct",
    "unread_chapters",
    "days_since_touch",
    "tag_affinity",
    "content_sim",
    "cf_score",
    "popularity",
    "effort_fit",
    "user_total_minutes",
    "user_avg_session_minutes",
    "user_reading_wpm",
]


def _tag_affinity(course_tags, tag_seconds: dict[str, float]) -> float:
    if not tag_seconds or not course_tags:
        return 0.0
    peak = max(tag_seconds.values()) or 1.0
    return max((tag_seconds.get(t, 0.0) / peak) for t in course_tags)


def build_rows(
    data,
    content_model,
    collab_model,
    decision_times: pd.DataFrame,
) -> pd.DataFrame:
    """decision_times: columns [user_id, decision_at]."""
    courses = data.courses.set_index("course_id")
    course_ids = list(courses.index)
    chapters_per_course = data.chapters.groupby("course_id").size().to_dict()

    # Enrolment timestamps per course, sorted, so popularity can be counted
    # AS OF the decision instant instead of from the finished table.
    enrol_times: dict[str, np.ndarray] = {}
    _e = data.enrollments.copy()
    _e["enrolled_at"] = pd.to_datetime(_e["enrolled_at"])
    for cid, grp in _e.groupby("course_id"):
        enrol_times[cid] = np.sort(grp["enrolled_at"].to_numpy())

    progress = data.progress.copy()
    progress["completed_at"] = pd.to_datetime(progress["completed_at"])
    enrollments = data.enrollments.copy()
    enrollments["enrolled_at"] = pd.to_datetime(enrollments["enrolled_at"])
    sessions = data.sessions.copy()
    sessions["started_at"] = pd.to_datetime(sessions["started_at"])

    rows: list[dict] = []

    for user_id, group in decision_times.groupby("user_id"):
        u_prog = progress[progress["user_id"] == user_id]
        u_enr = enrollments[enrollments["user_id"] == user_id]
        u_ses = sessions[sessions["user_id"] == user_id]

        for decision_at in group["decision_at"]:
            horizon = decision_at + pd.Timedelta(days=HORIZON_DAYS)

            # --- history strictly before the decision -------------------------
            past = u_prog[u_prog["completed_at"].notna() & (u_prog["completed_at"] < decision_at)]
            past_enr = u_enr[u_enr["enrolled_at"] < decision_at]
            past_ses = u_ses[u_ses["started_at"] < decision_at]

            if past.empty and past_enr.empty:
                continue  # nothing to learn from yet

            seconds_by_course = past.groupby("course_id")["active_seconds"].sum().to_dict()
            done_by_course = past.groupby("course_id").size().to_dict()

            tag_seconds: dict[str, float] = {}
            for cid, secs in seconds_by_course.items():
                for tag in courses.loc[cid, "tags"] or []:
                    tag_seconds[tag] = tag_seconds.get(tag, 0.0) + float(secs)

            read_courses = [c for c, s in seconds_by_course.items() if s > 0]

            total_minutes = sum(seconds_by_course.values()) / 60.0
            avg_session_minutes = (
                past_ses["active_seconds"].mean() / 60.0 if len(past_ses) else 0.0
            )
            words = past["word_count"].sum()
            secs = past["active_seconds"].sum()
            wpm = (words / secs * 60.0) if secs > 0 else 200.0

            enrolled_ids = set(past_enr["course_id"])
            completed_ids = set(
                past_enr[past_enr["status"] == "COMPLETED"]["course_id"]
            )

            # --- label: engagement inside the horizon --------------------------
            future = u_prog[
                u_prog["completed_at"].notna()
                & (u_prog["completed_at"] >= decision_at)
                & (u_prog["completed_at"] < horizon)
            ]
            positive_courses = set(future["course_id"])

            for cid in course_ids:
                if cid in completed_ids:
                    continue  # already finished: hard exclusion, never a candidate

                course = courses.loc[cid]
                is_enrolled = 1.0 if cid in enrolled_ids else 0.0
                done = float(done_by_course.get(cid, 0))
                total_chapters = float(chapters_per_course.get(cid, 1))
                # Derived from chapters completed BEFORE the decision. Reading
                # Enrollment.progressPct here would import the future, since that
                # column reflects the learner's final state.
                progress_pct = 100.0 * done / total_chapters if total_chapters else 0.0

                touched = past[past["course_id"] == cid]["completed_at"]
                days_since = (
                    (decision_at - touched.max()).total_seconds() / 86400.0
                    if len(touched)
                    else 999.0
                )

                budget = avg_session_minutes or 20.0
                est = float(course["estimated_minutes"])
                effort_fit = 1.0 if est <= budget else max(0.0, 1.0 - (est - budget) / (budget * 2))

                rows.append(
                    {
                        "user_id": user_id,
                        "course_id": cid,
                        "decision_at": decision_at,
                        "prior_seconds_on_course": float(np.log1p(seconds_by_course.get(cid, 0))),
                        "prior_chapters_done": done,
                        "is_enrolled": is_enrolled,
                        "progress_pct": progress_pct / 100.0,
                        "unread_chapters": max(0.0, total_chapters - done) / total_chapters,
                        "days_since_touch": min(days_since, 60.0) / 60.0,
                        "tag_affinity": _tag_affinity(course["tags"] or [], tag_seconds),
                        "content_sim": content_model.max_similarity_to(cid, read_courses),
                        "cf_score": collab_model.score(user_id, cid),
                        "popularity": float(
                            np.log1p(
                                np.searchsorted(
                                    enrol_times.get(cid, np.array([], dtype="datetime64[ns]")),
                                    np.datetime64(decision_at),
                                    side="left",
                                )
                            )
                        ),
                        "effort_fit": effort_fit,
                        "user_total_minutes": float(np.log1p(total_minutes)),
                        "user_avg_session_minutes": float(np.log1p(avg_session_minutes)),
                        "user_reading_wpm": wpm / 400.0,
                        "label": 1 if cid in positive_courses else 0,
                    }
                )

    return pd.DataFrame(rows)


def session_decision_points(data) -> pd.DataFrame:
    sessions = data.sessions.copy()
    sessions["started_at"] = pd.to_datetime(sessions["started_at"])
    return sessions[["user_id", "started_at"]].rename(
        columns={"started_at": "decision_at"}
    )
