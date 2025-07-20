#!/bin/bash
# WorkFlo API Auto-Start Script
# Checks if API is running and starts it if needed

API_PORT=${WORKFLO_API_PORT:-5000}
API_URL="http://localhost:${API_PORT}/api/health"

# Check if API is already running
if curl -s -f "${API_URL}" > /dev/null 2>&1; then
    echo "WorkFlo API is already running on port ${API_PORT}"
    exit 0
fi

echo "Starting WorkFlo API server on port ${API_PORT}..."

# Find the WorkFlo CLI tool
if command -v workflo &> /dev/null; then
    # Start API server in background
    nohup workflo serve --port ${API_PORT} > /dev/null 2>&1 &
    API_PID=$!
    
    # Wait for API to start (max 10 seconds)
    for i in {1..20}; do
        if curl -s -f "${API_URL}" > /dev/null 2>&1; then
            echo "WorkFlo API started successfully (PID: ${API_PID})"
            exit 0
        fi
        sleep 0.5
    done
    
    echo "Failed to start WorkFlo API"
    exit 1
else
    echo "Error: WorkFlo CLI not found. Please install it first."
    echo "Installation: dotnet tool install -g WorkFlo.Cli"
    exit 1
fi