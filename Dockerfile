# Multi-Stage Full-Stack Dockerfile (Dynamic Backend + Frontend SPA)
# Stage 1: Build React + Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python 3.12 Multi-Hazard Risk Decision Engine Runtime
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application, historical datasets, and scripts
COPY backend/ backend/
COPY data/ data/
COPY scripts/ scripts/
COPY .env.example .env.example

# Copy built frontend SPA from Stage 1
COPY --from=frontend-builder /app/frontend/dist frontend/dist

ENV PYTHONPATH="/app:/app/backend"
ENV PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["sh", "-c", "python scripts/import_historical_events.py && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
