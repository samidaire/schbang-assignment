# ─── Stage 1: Install dependencies ───────────────────────────────
FROM python:3.14-slim AS deps

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy only dependency files first (cache layer)
COPY pyproject.toml uv.lock ./

# Install dependencies into a virtual env
RUN uv sync --frozen --no-dev


# ─── Stage 2: Runtime ────────────────────────────────────────────
FROM python:3.14-slim AS runtime

WORKDIR /app

# Copy virtual env from deps stage
COPY --from=deps /app/.venv /app/.venv

# Copy application source
COPY . .

# Remove local dev files that shouldn't be in the image
RUN rm -f .env influencer_ai.db test_response.json

# Ensure virtualenv is on the PATH
ENV PATH="/app/.venv/bin:$PATH"

# SQLite will live on the persistent disk mounted at /data
ENV DATABASE_PATH="/data/influencer_ai.db"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
