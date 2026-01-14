#!/bin/bash

# OSRS Grand Exchange Tracker - Setup Script
# This script helps you set up the development environment

echo "========================================"
echo "OSRS GE Tracker - Setup Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
echo ""

ALL_INSTALLED=true

# Check Go
if command -v go &> /dev/null; then
    GO_VERSION=$(go version)
    echo -e "${GREEN}✓ Go is installed: $GO_VERSION${NC}"
else
    echo -e "${RED}✗ Go is NOT installed${NC}"
    echo -e "${YELLOW}  Please install Go 1.22+ from: https://golang.org/doc/install${NC}"
    ALL_INSTALLED=false
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js is installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js is NOT installed${NC}"
    echo -e "${YELLOW}  Please install Node.js 20+ from: https://nodejs.org/${NC}"
    ALL_INSTALLED=false
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker is installed: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}✗ Docker is NOT installed${NC}"
    echo -e "${YELLOW}  Please install Docker from: https://www.docker.com/products/docker-desktop/${NC}"
    ALL_INSTALLED=false
fi

echo ""
echo "========================================"

if [ "$ALL_INSTALLED" = true ]; then
    echo ""
    echo -e "${GREEN}All prerequisites are installed!${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "${NC}1. Start Docker services:${NC}"
    echo "   docker-compose up -d postgres redis"
    echo ""
    echo -e "${NC}2. Setup backend:${NC}"
    echo "   cd backend"
    echo "   cp .env.example .env"
    echo "   go mod download"
    echo "   go run cmd/api/main.go"
    echo ""
    echo -e "${NC}3. Setup frontend (in a new terminal):${NC}"
    echo "   cd frontend"
    echo "   cp .env.example .env"
    echo "   npm install"
    echo "   npm run dev"
    echo ""
else
    echo ""
    echo -e "${YELLOW}Please install missing prerequisites and run this script again.${NC}"
    echo ""
fi
