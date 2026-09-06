# syntax=docker/dockerfile:1
FROM python:3.13.2-slim
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.10.9 /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY adhyayan_ml ./adhyayan_ml

# One-shot by design: train then score, then exit. This is a batch job, not a
# service — the web app reads the Recommendation table, never this container.
CMD ["sh", "-c", "uv run python -m adhyayan_ml.train && uv run python -m adhyayan_ml.score"]
