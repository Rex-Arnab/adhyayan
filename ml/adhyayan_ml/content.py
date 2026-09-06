"""Content-based similarity.

TF-IDF over each course's real prose (title, summary, tags and every chapter's
markdown) plus cosine similarity. This arm needs ZERO interaction data, which
makes it the honest answer to cold start: a brand-new learner who reads one
chapter can already be pointed at the most similar course.
"""

from __future__ import annotations

import re

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CODE_FENCE = re.compile(r"```.*?```", re.DOTALL)
NON_WORD = re.compile(r"[^a-zA-Z0-9+#. ]+")


def _clean(markdown: str) -> str:
    """Strip fenced code before vectorising.

    Code blocks are dominated by punctuation and language keywords that appear in
    every programming course, which washes out the topical signal we actually
    want (flexbox vs join vs commit).
    """
    text = CODE_FENCE.sub(" ", markdown or "")
    text = NON_WORD.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip().lower()


class ContentModel:
    def __init__(self, course_ids: list[str], similarity: np.ndarray, vectorizer, matrix):
        self.course_ids = course_ids
        self.index = {cid: i for i, cid in enumerate(course_ids)}
        self.similarity = similarity
        self.vectorizer = vectorizer
        self.matrix = matrix

    def between(self, course_a: str, course_b: str) -> float:
        ia, ib = self.index.get(course_a), self.index.get(course_b)
        if ia is None or ib is None:
            return 0.0
        return float(self.similarity[ia, ib])

    def max_similarity_to(self, course_id: str, others: list[str]) -> float:
        """Best match between a candidate and any course the learner has read."""
        scores = [self.between(course_id, o) for o in others if o != course_id]
        return max(scores) if scores else 0.0

    def nearest(self, course_id: str, k: int = 3) -> list[tuple[str, float]]:
        i = self.index.get(course_id)
        if i is None:
            return []
        row = self.similarity[i].copy()
        row[i] = -1.0
        order = np.argsort(row)[::-1][:k]
        return [(self.course_ids[j], float(row[j])) for j in order]


def fit(courses: pd.DataFrame, chapters: pd.DataFrame) -> ContentModel:
    docs: list[str] = []
    ids: list[str] = []

    for _, course in courses.iterrows():
        body = " ".join(
            chapters.loc[chapters["course_id"] == course["course_id"], "content_md"]
            .map(_clean)
            .tolist()
        )
        tags = " ".join(course["tags"] or [])
        # Repeat title and tags so short, high-signal fields are not drowned out
        # by several thousand words of chapter prose.
        docs.append(
            f"{course['course_title']} {course['course_title']} {tags} {tags} "
            f"{_clean(course['summary'])} {_clean(course['description'])} {body}"
        )
        ids.append(course["course_id"])

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.9,
        sublinear_tf=True,
        max_features=20000,
    )
    matrix = vectorizer.fit_transform(docs)
    similarity = cosine_similarity(matrix)
    return ContentModel(ids, similarity, vectorizer, matrix)


if __name__ == "__main__":
    from .extract import load

    data = load()
    model = fit(data.courses, data.chapters)
    titles = dict(zip(data.courses["course_id"], data.courses["course_title"]))

    print(f"vocabulary: {len(model.vectorizer.vocabulary_)} terms\n")
    print("Nearest neighbours by content:")
    for cid in model.course_ids:
        neighbours = ", ".join(
            f"{titles[o]} ({s:.3f})" for o, s in model.nearest(cid, 2)
        )
        print(f"  {titles[cid]:<28} -> {neighbours}")
