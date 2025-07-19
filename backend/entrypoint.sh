#!/bin/bash

# Wait for the database to be ready
echo "Waiting for PostgreSQL..."
while ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; do
  sleep 1
done
echo "PostgreSQL is up and running!"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files if needed
# echo "Collecting static files..."
# python manage.py collectstatic --noinput

# Start the server
echo "Starting Django server..."
python manage.py runserver 0.0.0.0:8000