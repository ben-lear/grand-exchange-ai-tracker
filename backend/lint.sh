#!/bin/bash
# Lint script for Unix-like systems (Linux, macOS)
# Runs golangci-lint with optional auto-fix

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Default values
FIX=false
VERBOSE=false
CONFIG=".golangci.yml"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--fix)
            FIX=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--config)
            CONFIG="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -f, --fix        Auto-fix issues where possible"
            echo "  -v, --verbose    Enable verbose output"
            echo "  -c, --config     Specify config file (default: .golangci.yml)"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🔍 Running golangci-lint...${NC}"

# Check if golangci-lint is installed
if ! command -v golangci-lint &> /dev/null; then
    echo -e "${RED}❌ golangci-lint is not installed!${NC}"
    echo ""
    echo -e "${YELLOW}To install:${NC}"
    echo -e "${GRAY}  Using Go:${NC}"
    echo -e "${GRAY}    go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest${NC}"
    echo -e "${GRAY}  Or using Homebrew (macOS):${NC}"
    echo -e "${GRAY}    brew install golangci-lint${NC}"
    echo -e "${GRAY}  Or see: https://golangci-lint.run/usage/install/${NC}"
    exit 1
fi

# Build command arguments
ARGS=("run" "--config" "$CONFIG")

if [ "$FIX" = true ]; then
    ARGS+=("--fix")
    echo -e "${YELLOW}🔧 Auto-fix mode enabled${NC}"
fi

if [ "$VERBOSE" = true ]; then
    ARGS+=("--verbose")
fi

# Run linter
echo -e "${GRAY}Running: golangci-lint ${ARGS[*]}${NC}"
echo ""

if golangci-lint "${ARGS[@]}"; then
    echo ""
    echo -e "${GREEN}✅ Linting passed!${NC}"
    exit 0
else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}❌ Linting failed with $EXIT_CODE issue(s)${NC}"
    exit $EXIT_CODE
fi
