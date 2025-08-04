#!/bin/bash
# lib/common.sh - Essential common utilities for WorkFlo scripts
# Simplified version extracted from legacy/scripts/lib/common.sh

# Only initialize once
if [[ "${WORKFLO_COMMON_LIB_LOADED:-}" == "true" ]]; then
    return 0
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Standard directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Essential print functions
info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
    exit 1
}

# Tool checking function
check_tool() {
    local tool="$1"
    local install_msg="$2"
    
    if ! command -v "$tool" >/dev/null 2>&1; then
        error "$tool not found. Install with: $install_msg"
        return 1
    fi
    return 0
}

# Basic prerequisites check
check_prereqs() {
    check_tool "gh" "https://cli.github.com/"
    check_tool "jq" "sudo apt-get install jq"
    check_tool "git" "sudo apt-get install git"
}

# Timer functions
start_timer() {
    date +%s
}

end_timer() {
    local start_time="$1"
    local end_time=$(date +%s)
    echo $((end_time - start_time))
}

format_duration() {
    local duration="$1"
    local hours=$((duration / 3600))
    local minutes=$(((duration % 3600) / 60))
    local seconds=$((duration % 60))
    
    if [[ $hours -gt 0 ]]; then
        echo "${hours}h ${minutes}m ${seconds}s"
    elif [[ $minutes -gt 0 ]]; then
        echo "${minutes}m ${seconds}s"
    else
        echo "${seconds}s"
    fi
}

# Mark library as loaded
WORKFLO_COMMON_LIB_LOADED=true