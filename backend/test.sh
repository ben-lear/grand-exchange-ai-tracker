#!/bin/bash
# Test runner script for Unix/Linux/macOS

set -e

FAST=false
COVERAGE=false

for arg in "$@"; do
    case "$arg" in
        --fast)
            FAST=true
            ;;
        --coverage)
            COVERAGE=true
            ;;
        --help|-h)
            echo "Usage: ./test.sh [--fast] [--coverage]"
            echo "  --fast       Run fast tests only (no Docker)"
            echo "  --coverage   Generate coverage reports (fast + full by default)"
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

TAGS=()
if [ "$FAST" = false ]; then
    TAGS+=("-tags=slow")

    # Check if Docker is running (slow suite only)
    if ! docker info > /dev/null 2>&1; then
            echo "❌ Docker is not running. Please start Docker and try again."
            exit 1
    fi
fi

if [ "$COVERAGE" = true ]; then
    mkdir -p coverage

    run_coverage() {
        local label="$1"
        local out_profile="$2"
        local out_html="$3"
        shift 3

        local covdir
        covdir="$(mktemp -d)"

        echo "🧪 Running Backend Tests (${label}) with coverage..."
        GOCOVERDIR="$covdir" go test ./... -v -count=1 -cover -covermode=atomic -coverpkg=./... "$@"

        go tool covdata textfmt -i "$covdir" -o "$out_profile"
        go tool cover -html="$out_profile" -o "$out_html"

        rm -rf "$covdir"
    }

    if [ "$FAST" = true ]; then
        run_coverage "fast" "coverage/fast.out" "coverage/fast.html"

        echo ""
        echo "✅ All tests passed!"
        echo "Coverage reports:"
        echo "- coverage/fast.out"
        echo "- coverage/fast.html"
        exit 0
    fi

    # Standard validation: run BOTH fast and full suites.
    # Coverage is generated for both test types.
    run_coverage "fast" "coverage/fast.out" "coverage/fast.html"

    # Full suite requires Docker.
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi

    run_coverage "full suite" "coverage/full.out" "coverage/full.html" -tags=slow

    echo ""
    echo "✅ All tests passed!"
    echo "Coverage reports:"
    echo "- coverage/fast.out"
    echo "- coverage/fast.html"
    echo "- coverage/full.out"
    echo "- coverage/full.html"
    exit 0
fi

if [ "$FAST" = true ]; then
    echo "🧪 Running Backend Tests (fast suite)..."
else
    echo "🧪 Running Backend Tests (full suite)..."
fi

go test ./... -v -count=1 "${TAGS[@]}"

echo ""
echo "✅ All tests passed!"
