#!/bin/bash
# Test runner script for Unix/Linux/macOS

set -e

COVERAGE=false

for arg in "$@"; do
    case "$arg" in
        --coverage)
            COVERAGE=true
            ;;
        --help|-h)
            echo "Usage: ./test.sh [--coverage]"
            echo "  --coverage   Generate coverage report"
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg"
            echo "Use --help for usage."
            exit 1
            ;;
    esac
done

echo "🧪 Running OSRS GE Tracker Backend Tests"
echo ""

# Check if Docker is running (required for integration tests)
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

if [ "$COVERAGE" = true ]; then
    mkdir -p coverage

    echo "🧪 Running Backend Tests with coverage..."
    go test ./... -v -count=1 -coverprofile=coverage/coverage.out -covermode=atomic -coverpkg=./...
    
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed"
        exit 1
    fi

    echo "📊 Generating HTML coverage report..."
    go tool cover -html=coverage/coverage.out -o coverage/coverage.html
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to generate HTML coverage report"
        exit 1
    fi

    echo ""
    echo "✅ All tests passed!"
    echo "Coverage reports:"
    echo "- coverage/coverage.out"
    echo "- coverage/coverage.html"
    
    echo ""
    echo "📊 Coverage Summary:"
    go tool cover -func=coverage/coverage.out | grep "^total:"
    
    exit 0
fi

echo "🧪 Running Backend Tests..."
go test ./... -v -count=1

if [ $? -ne 0 ]; then
    echo "❌ Tests failed"
    exit 1
fi

echo ""
echo "✅ All tests passed!"
