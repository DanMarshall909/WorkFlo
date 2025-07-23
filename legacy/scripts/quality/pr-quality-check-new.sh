#!/bin/bash

# WorkFlo PR Quality Check Wrapper
# This script uses the universal pr-quality-check.sh from workflow-tools

set -euo pipefail

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load project configuration
if [[ -f "$PROJECT_ROOT/project-config.sh" ]]; then
    source "$PROJECT_ROOT/project-config.sh"
else
    echo "❌ Error: project-config.sh not found. Please create it in the project root."
    exit 1
fi

# Check if workflow-tools is available
WORKFLOW_TOOLS_SCRIPT="$WORKFLOW_TOOLS_PATH/scripts/pr-quality-check.sh"
if [[ ! -f "$WORKFLOW_TOOLS_SCRIPT" ]]; then
    echo "❌ Error: workflow-tools pr-quality-check.sh not found at: $WORKFLOW_TOOLS_SCRIPT"
    echo "Please ensure workflow-tools repository is cloned alongside this project."
    exit 1
fi

# Execute the universal script with project-specific configuration
exec "$WORKFLOW_TOOLS_SCRIPT" \
    --project "$PROJECT_NAME" \
    --solution "$SOLUTION_FILE" \
    "$@"