#!/bin/bash

# Wrapper script for notify.sh in workflow-tools submodule
# This maintains compatibility while using the centralized version

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_NOTIFY="$SCRIPT_DIR/../.workflow/scripts/notify.sh"

if [[ -f "$WORKFLOW_NOTIFY" ]]; then
    exec "$WORKFLOW_NOTIFY" "$@"
else
    echo "Error: Workflow tools not found. Please run: git submodule update --init"
    exit 1
fi