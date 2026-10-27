# ==========================================================
# Stage 1: Build the React 18 / Vite / TypeScript Frontend
# ==========================================================
FROM node:20-slim AS frontend-builder
WORKDIR /build

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================================
# Stage 2: Production Python FastAPI + LangGraph Backend
# ==========================================================
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Copy built frontend assets from Stage 1 into /app/static
COPY --from=frontend-builder /build/dist /app/static

# Create data directory for SQLite fallback when no external DB is set
RUN mkdir -p /app/data

# Hugging Face Spaces runs as user with UID 1000
RUN useradd -m -u 1000 user && chown -R user:user /app
USER user

# Set Hugging Face Spaces environment variables
ENV PORT=7860
ENV STATIC_DIR=/app/static
ENV PYTHONUNBUFFERED=1

EXPOSE 7860

# Start script running migrations and uvicorn on port 7860
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 7860"]
