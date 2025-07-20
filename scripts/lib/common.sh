#!/bin/bash
# scripts/lib/common.sh - Common utilities and functions
# Shared by all workflow scripts to eliminate duplication

# Only initialize once
if [[ "${COMMON_LIB_LOADED:-}" == "true" ]]; then
    return 0
fi

# Colors - single source of truth
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Standard directories - calculated once
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$PROJECT_ROOT/reports"

# Create reports directory if it doesn't exist
mkdir -p "$REPORTS_DIR"

# Standard print functions
print_header() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${PURPLE}🐛 DEBUG: $1${NC}"
    fi
}

# Enhanced error handling
fatal_error() {
    print_error "$1"
    exit 1
}

# Configuration respecting versions of print functions
print_header_config() {
    if [[ "${NOTIF_EMOJI:-true}" == "true" ]]; then
        echo -e "${BLUE}🔍 $1${NC}"
    else
        echo -e "${BLUE}[INFO] $1${NC}"
    fi
}

print_success_config() {
    if [[ "${NOTIF_EMOJI:-true}" == "true" ]]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${GREEN}[SUCCESS] $1${NC}"
    fi
}

print_warning_config() {
    if [[ "${NOTIF_EMOJI:-true}" == "true" ]]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    else
        echo -e "${YELLOW}[WARNING] $1${NC}"
    fi
}

print_error_config() {
    if [[ "${NOTIF_EMOJI:-true}" == "true" ]]; then
        echo -e "${RED}❌ $1${NC}"
    else
        echo -e "${RED}[ERROR] $1${NC}"
    fi
}

print_info_config() {
    if [[ "${NOTIF_EMOJI:-true}" == "true" ]]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    else
        echo -e "${BLUE}[INFO] $1${NC}"
    fi
}

# Tool availability checks
check_tool() {
    local tool="$1"
    local install_hint="${2:-}"
    
    if ! command -v "$tool" >/dev/null 2>&1; then
        print_error "$tool not found"
        if [[ -n "$install_hint" ]]; then
            print_info "Install with: $install_hint"
        fi
        return 1
    fi
    return 0
}

# Standard prerequisite checks
check_common_prereqs() {
    local missing_tools=()
    
    if ! check_tool "git"; then
        missing_tools+=("git")
    fi
    
    if ! check_tool "dotnet" "https://dotnet.microsoft.com/"; then
        missing_tools+=("dotnet")
    fi
    
    if ! check_tool "jq" "sudo apt-get install jq"; then
        missing_tools+=("jq")
    fi
    
    if ! check_tool "gh" "https://cli.github.com/"; then
        missing_tools+=("gh")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        fatal_error "Missing required tools: ${missing_tools[*]}"
    fi
    
    print_success "All common prerequisites available"
}

# Git repository validation
check_git_repo() {
    if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
        fatal_error "Not in a git repository"
    fi
}

# Check if GitHub CLI is authenticated
check_gh_auth() {
    if ! gh auth status >/dev/null 2>&1; then
        fatal_error "GitHub CLI not authenticated. Run 'gh auth login' first."
    fi
}

# Get current git branch
get_current_branch() {
    git symbolic-ref HEAD | sed 's|refs/heads/||'
}

# Check if there are staged changes
has_staged_changes() {
    ! git diff --cached --quiet
}

# Check if there are unstaged changes
has_unstaged_changes() {
    ! git diff --quiet
}

# Get list of staged files
get_staged_files() {
    git diff --cached --name-only
}

# Get list of modified files
get_modified_files() {
    git diff --name-only
}

# Timer functions for performance tracking
start_timer() {
    echo "$(date +%s)"
}

end_timer() {
    local start_time="$1"
    local end_time="$(date +%s)"
    local duration=$((end_time - start_time))
    echo "$duration"
}

format_duration() {
    local duration="$1"
    if [[ $duration -lt 60 ]]; then
        echo "${duration}s"
    else
        echo "$((duration / 60))m $((duration % 60))s"
    fi
}

# Configuration loading helper
load_config_if_exists() {
    local config_file="$PROJECT_ROOT/.workflow/config-loader.sh"
    if [[ -f "$config_file" ]]; then
        source "$config_file"
        if command -v load_all_config >/dev/null 2>&1; then
            load_all_config
        fi
    fi
}

# Mark library as loaded
COMMON_LIB_LOADED=true

print_debug "Common library loaded: $BASH_SOURCE"