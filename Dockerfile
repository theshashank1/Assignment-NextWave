# ==========================================
# Multi-stage Dockerfile for AI Question Workshop
# Produces a single, lightweight production image
# ==========================================

# --- Stage 1: Build React Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Python Backend with uv ---
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS backend

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    PORT=8000

# Install backend dependencies
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock backend/requirements.txt ./
RUN uv sync --frozen --no-dev || uv pip install -r requirements.txt

# Copy backend application source
COPY backend/ ./

# Copy built frontend from Stage 1 into the location expected by FastAPI
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port (Render/Railway dynamically pass $PORT)
EXPOSE 8000

# Start FastAPI server using uvicorn
CMD ["sh", "-c", "uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
