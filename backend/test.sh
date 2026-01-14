#!/bin/bash
# Test runner script for Unix/Linux/macOS

set -e

echo "🧪 Running OSRS GE Tracker Tests"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start PostgreSQL if not already running
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=30
counter=0
until docker-compose exec -T postgres pg_isready -U osrs_tracker > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        echo "❌ PostgreSQL failed to start within ${timeout} seconds"
        exit 1
    fi
    sleep 1
done

echo "✅ PostgreSQL is ready"
echo ""

# Set database connection for repository tests
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=osrs_tracker
export POSTGRES_PASSWORD=changeme
export POSTGRES_DB=osrs_ge_tracker

# Run all tests
echo "🧪 Running All Unit Tests..."
go test ./tests/unit/... -v -count=1

echo ""
echo "✅ All tests passed!"
