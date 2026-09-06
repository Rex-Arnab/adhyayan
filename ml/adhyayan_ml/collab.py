"""Collaborative filtering by truncated SVD on the implicit interaction matrix.

Cell value is a confidence built from time actually spent, not a rating nobody
gave. Guarded: below a handful of users, or when the retained variance is
degenerate, the model reports unavailable and the pipeline falls back rather
than emitting latent factors fitted to noise.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize

MIN_USERS = 5
MIN_INTERACTIONS = 20
MIN_EXPLAINED_VARIANCE = 0.10


class CollabModel:
    def __init__(self, user_ids, course_ids, user_factors, item_factors, explained):
        self.user_index = {u: i for i, u in enumerate(user_ids)}
        self.course_index = {c: i for i, c in enumerate(course_ids)}
        self.course_ids = course_ids
        self.user_factors = user_factors
        self.item_factors = item_factors
        self.explained_variance = explained
        self.available = True

    def score(self, user_id: str, course_id: str) -> float:
        ui = self.user_index.get(user_id)
        ci = self.course_index.get(course_id)
        if ui is None or ci is None:
            return 0.0
        # Both factor sets are L2-normalised, so this is a cosine in [-1, 1].
        raw = float(np.dot(self.user_factors[ui], self.item_factors[ci]))
        return max(0.0, min(1.0, (raw + 1.0) / 2.0))


class UnavailableCollab:
    available = False
    explained_variance = 0.0

    def score(self, user_id: str, course_id: str) -> float:  # noqa: ARG002
        return 0.0


def build_matrix(progress: pd.DataFrame) -> tuple[pd.DataFrame, list[str], list[str]]:
    """User x course matrix of log-scaled active seconds."""
    if progress.empty:
        return pd.DataFrame(), [], []

    grouped = (
        progress.groupby(["user_id", "course_id"])["active_seconds"].sum().reset_index()
    )
    # log1p compresses the binge readers so one heavy user cannot dominate every
    # latent factor.
    grouped["weight"] = np.log1p(grouped["active_seconds"])
    matrix = grouped.pivot(index="user_id", columns="course_id", values="weight").fillna(0.0)
    return matrix, list(matrix.index), list(matrix.columns)


def fit(progress: pd.DataFrame, n_components: int = 8):
    matrix, user_ids, course_ids = build_matrix(progress)

    if matrix.empty or len(user_ids) < MIN_USERS:
        return UnavailableCollab()
    interactions = int((matrix.to_numpy() > 0).sum())
    if interactions < MIN_INTERACTIONS:
        return UnavailableCollab()

    # Components cannot exceed min(dim) - 1.
    k = min(n_components, len(course_ids) - 1, len(user_ids) - 1)
    if k < 2:
        return UnavailableCollab()

    svd = TruncatedSVD(n_components=k, random_state=20260906)
    user_factors = svd.fit_transform(matrix.to_numpy())
    item_factors = svd.components_.T

    explained = float(svd.explained_variance_ratio_.sum())
    if explained < MIN_EXPLAINED_VARIANCE:
        return UnavailableCollab()

    return CollabModel(
        user_ids,
        course_ids,
        normalize(user_factors),
        normalize(item_factors),
        explained,
    )


if __name__ == "__main__":
    from .extract import load

    data = load()
    model = fit(data.progress)
    titles = dict(zip(data.courses["course_id"], data.courses["course_title"]))

    print(f"available={model.available}  explained_variance={model.explained_variance:.3f}")
    if model.available:
        matrix, users, courses = build_matrix(data.progress)
        print(f"matrix: {len(users)} users x {len(courses)} courses, "
              f"density={(matrix.to_numpy() > 0).mean():.2%}\n")
        sample = users[:3]
        for u in sample:
            ranked = sorted(
                ((titles[c], model.score(u, c)) for c in model.course_ids),
                key=lambda x: -x[1],
            )[:3]
            print(f"  {u}: " + ", ".join(f"{t} {s:.3f}" for t, s in ranked))
