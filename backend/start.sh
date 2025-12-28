#!/bin/bash

# Wait for database to be ready
echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Run migrations
echo "Running migrations..."
alembic upgrade head

# Start app
echo "Starting FastAPI..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
