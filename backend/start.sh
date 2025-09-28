#!/bin/sh

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy || echo "Migration failed, continuing..."

# Start the application
echo "Starting application..."
node dist/server.js