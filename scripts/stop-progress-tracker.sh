#!/bin/bash

# WorkFlo Development Progress Tracker Stop Script
# Cleanly stops all services started by the progress tracker

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/dan/code/WorkFlo"

echo -e "${BLUE}🛑 Stopping WorkFlo Development Environment...${NC}"

# Stop progress tracker HTTP server
echo -e "${YELLOW}🌐 Stopping progress tracker HTTP server...${NC}"
pkill -f "python3 -m http.server 3001" 2>/dev/null || true

# Stop GitHub CLI API server
echo -e "${YELLOW}🔧 Stopping GitHub CLI API server...${NC}"
pkill -f "node.*gh-api-server" 2>/dev/null || true

# Clean up PID files and temporary files
rm -f "$PROJECT_DIR/.progress-server.pid" 2>/dev/null || true
rm -f "$PROJECT_DIR/.gh-api-server.pid" 2>/dev/null || true
rm -f "$PROJECT_DIR/.temp-key-loader.js" 2>/dev/null || true

# Clear environment variables (for current session)
unset CLAUDE_API_KEY 2>/dev/null || true
unset GITHUB_TOKEN 2>/dev/null || true

echo -e "${GREEN}✅ All services stopped${NC}"
echo -e "${BLUE}🔐 Environment variables cleared from current session${NC}"
echo -e "${YELLOW}💡 Encrypted keys remain safely stored${NC}"