FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PostgreSQL compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run database migrations and start uvicorn
EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python -m app.cli seed-data && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

