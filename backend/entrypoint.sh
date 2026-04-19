#!/bin/sh
set -e

echo "Waiting for PostgreSQL and applying migrations..."
until python manage.py migrate --noinput; do
  echo "Database unavailable, retrying in 2 seconds..."
  sleep 2
done

echo "Starting Django server..."
python manage.py runserver 0.0.0.0:8000
