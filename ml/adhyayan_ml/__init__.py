"""Adhyayan recommendation engine.

Reads learner behaviour from Postgres, fits content / collaborative / ranking
models, and writes cached recommendations back. The web app never calls this at
request time — it reads the Recommendation table, so a dead model degrades to
the TypeScript heuristic with no user-visible error.
"""

__version__ = "0.1.0"
