#!/bin/bash

# Auto Progress Update Service
# Automatically updates PROGRESS.md every 2 minutes during development

set -e

PROJECT_DIR="/home/dan/code/WorkFlo"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
PID_FILE="$PROJECT_DIR/.auto-progress.pid"

echo "🔄 Starting automatic progress updates..."

# Kill any existing auto-progress service
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Stopping existing auto-progress service (PID: $OLD_PID)"
        kill "$OLD_PID"
    fi
    rm -f "$PID_FILE"
fi

# Start background service
(
    while true; do
        cd "$PROJECT_DIR"
        
        # Only update if there are changes
        if ! git diff --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
            echo "$(date): Auto-updating progress..." >> .auto-progress.log
            "$SCRIPTS_DIR/update-progress.sh" >> .auto-progress.log 2>&1
        fi
        
        sleep 120  # Update every 2 minutes
    done
) &

# Save PID
echo $! > "$PID_FILE"

echo "✅ Auto-progress updates started (PID: $(cat $PID_FILE))"
echo "📄 Log file: $PROJECT_DIR/.auto-progress.log" 
echo "🛑 To stop: $SCRIPTS_DIR/stop-auto-progress.sh"