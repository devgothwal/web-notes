# =====================================================
# Web Notes - Production Dockerfile
# Multi-stage build for minimal image size
# =====================================================

# Stage 1: Build dependencies
FROM python:3.12-slim as builder

WORKDIR /app

# Install build dependencies
RUN pip install --no-cache-dir --upgrade pip

# Copy and install requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# Stage 2: Production image
FROM python:3.12-slim as production

WORKDIR /app

# Create non-root user for security
RUN useradd -m -u 1000 webnotes && \
    mkdir -p /data && \
    chown -R webnotes:webnotes /data

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY --chown=webnotes:webnotes . .

# Switch to non-root user
USER webnotes

# Environment
ENV PYTHONUNBUFFERED=1
ENV WEBNOTES_DB_PATH=/data/notes.db

# Expose port
EXPOSE 8888

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8888/api/dates || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8888"]
