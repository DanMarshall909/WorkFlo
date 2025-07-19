#!/bin/bash

# Start WorkFlo API if not already running

set -e

# ANSI color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# API Port (default)
API_PORT=5000

# Check for test mode
if [[ "$1" == "--test-mode" ]]; then
    print_info "Test mode enabled, skipping API start."
    exit 0
fi

# Check if API is running
if check_port $API_PORT; then
    print_info "WorkFlo API is already running on port $API_PORT"
else
    print_info "WorkFlo API not running, attempting to start..."
    
    # Get the script directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

    cd "$PROJECT_ROOT/src/WorkFlo.Api"

    # Start API server in background
    dotnet run --urls "http://localhost:$API_PORT" > /tmp/workflo-api.log 2>&1 &
    API_PID=$!

    # Wait a moment for API to start
    sleep 5

    # Check if API started successfully
    if ! kill -0 $API_PID 2>/dev/null; then
        print_error "Failed to start WorkFlo API. Check /tmp/workflo-api.log for details."
        exit 1
    fi
    print_success "WorkFlo API started successfully on http://localhost:$API_PORT"
fi
