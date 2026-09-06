"""The only module that issues SQL against the learning tables.

Everything downstream consumes DataFrames, so a schema change lands in exactly
one place and the feature code cannot quietly disagree with the app.
"""

from __future__ import annotations

import pandas as pd

from .db import connect

COURSES_SQL = """
select c.id                  as course_id,
       c.slug                as course_slug,
       c.title               as course_title,
       c.summary,
       c.description,
       c.level::text         as level,
       c.tags,
       c."estimatedMinutes"  as estimated_minutes,
       (select count(*) from "Enrollment" e where e."courseId" = c.id) as enrollment_count
from "Course" c
where c.published = true
"""

CHAPTERS_SQL = """
select ch.id                 as chapter_id,
       ch."courseId"         as course_id,
       ch."order"            as chapter_order,
       ch.slug               as chapter_slug,
       ch.title              as chapter_title,
       ch."contentMd"        as content_md,
       ch."wordCount"        as word_count,
       ch."estimatedMinutes" as estimated_minutes
from "Chapter" ch
"""

ENROLLMENTS_SQL = """
select e.id            as enrollment_id,
       e."userId"      as user_id,
       e."courseId"    as course_id,
       e.status::text  as status,
       e."progressPct" as progress_pct,
       e."enrolledAt"  as enrolled_at,
       e."lastSeenAt"  as last_seen_at,
       e."completedAt" as completed_at
from "Enrollment" e
"""

PROGRESS_SQL = """
select cp."enrollmentId"   as enrollment_id,
       cp."chapterId"      as chapter_id,
       e."userId"          as user_id,
       ch."courseId"       as course_id,
       cp.status::text     as status,
       cp."activeSeconds"  as active_seconds,
       cp."maxScrollPct"   as max_scroll_pct,
       cp."completedAt"    as completed_at,
       ch."wordCount"      as word_count
from "ChapterProgress" cp
join "Enrollment" e on e.id = cp."enrollmentId"
join "Chapter" ch on ch.id = cp."chapterId"
"""

SESSIONS_SQL = """
select s.id                  as session_id,
       s."userId"            as user_id,
       s."startedAt"         as started_at,
       s."activeSeconds"     as active_seconds,
       s."chaptersVisited"   as chapters_visited,
       s."chaptersCompleted" as chapters_completed
from "LearningSession" s
"""

EVENTS_SQL = """
select el.type,
       el."userId"    as user_id,
       el."courseId"  as course_id,
       el."chapterId" as chapter_id,
       el."createdAt" as created_at
from "EventLog" el
where el."userId" is not null
"""


def _frame(conn, sql: str) -> pd.DataFrame:
    with conn.cursor() as cur:
        cur.execute(sql)
        cols = [d.name for d in cur.description]
        return pd.DataFrame(cur.fetchall(), columns=cols)


class Dataset:
    """Every table the pipeline needs, loaded once."""

    def __init__(self, courses, chapters, enrollments, progress, sessions, events):
        self.courses = courses
        self.chapters = chapters
        self.enrollments = enrollments
        self.progress = progress
        self.sessions = sessions
        self.events = events

    def summary(self) -> dict:
        return {
            "courses": len(self.courses),
            "chapters": len(self.chapters),
            "users": int(self.enrollments["user_id"].nunique()) if len(self.enrollments) else 0,
            "enrollments": len(self.enrollments),
            "progress_rows": len(self.progress),
            "sessions": len(self.sessions),
            "events": len(self.events),
        }


def load() -> Dataset:
    with connect() as conn:
        return Dataset(
            courses=_frame(conn, COURSES_SQL),
            chapters=_frame(conn, CHAPTERS_SQL),
            enrollments=_frame(conn, ENROLLMENTS_SQL),
            progress=_frame(conn, PROGRESS_SQL),
            sessions=_frame(conn, SESSIONS_SQL),
            events=_frame(conn, EVENTS_SQL),
        )


if __name__ == "__main__":
    import json

    print(json.dumps(load().summary(), indent=2))
