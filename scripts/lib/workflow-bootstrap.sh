#!/bin/bash

# Workflow Bootstrap Script
# Universal library loader for all workflow scripts
# Eliminates duplication by loading all workflow-tools libraries

# Determine script directory and library paths
BOOTSTRAP_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_TOOLS_DIR="${BOOTSTRAP_SCRIPT_DIR}/workflow-tools"

# Check if workflow-tools directory exists
if [[ ! -d "$WORKFLOW_TOOLS_DIR" ]]; then
    echo "ERROR: workflow-tools directory not found at: $WORKFLOW_TOOLS_DIR" >&2
    return 1 2>/dev/null || exit 1
fi

# Source all workflow-tools libraries in dependency order
echo "Loading workflow libraries..." >&2

# 1. Load platform detection first (other libraries may depend on it)
if [[ -f "$WORKFLOW_TOOLS_DIR/platform-detection.sh" ]]; then
    source "$WORKFLOW_TOOLS_DIR/platform-detection.sh"
    echo "  ✓ Platform detection loaded" >&2
else
    echo "  ⚠ Platform detection not found" >&2
fi

# 2. Load colors and output functions (most commonly used)
if [[ -f "$WORKFLOW_TOOLS_DIR/colors.sh" ]]; then
    source "$WORKFLOW_TOOLS_DIR/colors.sh"
    echo "  ✓ Colors and output functions loaded" >&2
else
    echo "  ⚠ Colors library not found" >&2
fi

# 3. Load git utilities (depends on colors for output)
if [[ -f "$WORKFLOW_TOOLS_DIR/git-utils.sh" ]]; then
    source "$WORKFLOW_TOOLS_DIR/git-utils.sh"
    echo "  ✓ Git utilities loaded" >&2
else
    echo "  ⚠ Git utilities not found" >&2
fi

# 4. Load common utilities if it exists (check if it's a valid shell script)
if [[ -f "$WORKFLOW_TOOLS_DIR/common" ]]; then
    # Check if it looks like a shell script
    if head -n 1 "$WORKFLOW_TOOLS_DIR/common" | grep -q "^#!/bin/bash"; then
        source "$WORKFLOW_TOOLS_DIR/common"
        echo "  ✓ Common utilities loaded" >&2
    else
        echo "  ⚠ Common file found but not a shell script" >&2
    fi
fi

# Verify that essential functions are available
if ! declare -f print_success > /dev/null; then
    echo "ERROR: Essential functions not loaded. Colors library may have failed to load." >&2
    return 1 2>/dev/null || exit 1
fi

if ! declare -f is_git_repo > /dev/null; then
    echo "ERROR: Git utilities not loaded properly." >&2
    return 1 2>/dev/null || exit 1
fi

# Export commonly used variables for consistency
export WORKFLOW_LIBRARIES_LOADED=true
export WORKFLOW_TOOLS_DIR

echo "✅ All workflow libraries loaded successfully" >&2