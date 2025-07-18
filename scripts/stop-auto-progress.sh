#!/bin/bash

# Stop Auto Progress Update Service

PROJECT_DIR="/home/dan/code/Anchor"
PID_FILE="$PROJECT_DIR/.auto-progress.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Stopping auto-progress service (PID: $PID)"
        kill "$PID"
        rm -f "$PID_FILE"
        echo "✅ Auto-progress service stopped"
    else
        echo "⚠️ Auto-progress service not running"
        rm -f "$PID_FILE"
    fi
else
    echo "⚠️ No auto-progress service found"
fi