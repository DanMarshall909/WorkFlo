#!/bin/bash

# create-feature-branches.sh - Create feature branch with subissue tracking
# Usage: ./scripts/create-feature-branches.sh <issue-number>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configure target branch for trunk-based development
TARGET_BRANCH="${WORKFLO_MAIN_BRANCH:-master}"  # Trunk-based development

log() {
    echo -e "${BLUE}[FEATURE-BRANCHES]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if gh CLI is authenticated
check_auth() {
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI not authenticated. Run 'gh auth login' first."
    fi
}

# Get issue details from GitHub
get_issue_details() {
    local issue_number="$1"
    
    # Get issue title and convert to branch-friendly format
    local issue_title
    issue_title=$(gh issue view "$issue_number" --json title --jq '.title' 2>/dev/null || echo "")
    
    if [[ -z "$issue_title" ]]; then
        error "Issue #$issue_number not found or inaccessible"
    fi
    
    # Convert title to branch name (lowercase, replace spaces/special chars with hyphens, max 15 chars)
    local branch_suffix
    branch_suffix=$(echo "$issue_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' | cut -c1-15)
    
    echo "$issue_number-$branch_suffix"
}

# Extract test specifications from issue body
extract_test_specifications() {
    local issue_number="$1"
    
    log "Extracting test specifications from issue #$issue_number..."
    
    # Get issue body and extract test cases
    local issue_body
    issue_body=$(gh issue view "$issue_number" --json body --jq '.body' 2>/dev/null || echo "")
    
    if [[ -z "$issue_body" ]]; then
        warn "No issue body found for #$issue_number"
        return 0
    fi
    
    # Extract test cases (look for patterns like "Test 1:", "Integration 1:", etc.)
    local test_specs=()
    
    # Find unit tests
    while IFS= read -r line; do
        if [[ "$line" =~ ^\s*-\s*\[\s*\]\s*\*\*Test\ ([0-9]+)\*\*:\ (.+)$ ]]; then
            local test_num="${BASH_REMATCH[1]}"
            local test_desc="${BASH_REMATCH[2]}"
            # Generate short name for branch (max 15 chars)
            local short_name
            short_name=$(echo "$test_desc" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' | cut -c1-15)
            test_specs+=("unit-$test_num:$test_desc:$short_name")
        fi
    done <<< "$issue_body"
    
    # Find integration tests
    while IFS= read -r line; do
        if [[ "$line" =~ ^\s*-\s*\[\s*\]\s*\*\*Integration\ ([0-9]+)\*\*:\ (.+)$ ]]; then
            local test_num="${BASH_REMATCH[1]}"
            local test_desc="${BASH_REMATCH[2]}"
            # Generate short name for branch (max 15 chars)
            local short_name
            short_name=$(echo "$test_desc" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' | cut -c1-15)
            test_specs+=("integration-$test_num:$test_desc:$short_name")
        fi
    done <<< "$issue_body"
    
    # Output test specifications
    printf '%s\n' "${test_specs[@]}"
}

# Create main feature branch
create_feature_branch() {
    local issue_number="$1"
    local branch_name="$2"
    
    log "Creating feature branch: feature/$branch_name"
    
    # Ensure we're on target branch and up to date
    git checkout "$TARGET_BRANCH"
    git pull origin "$TARGET_BRANCH"
    
    # Create and checkout feature branch
    git checkout -b "feature/$branch_name"
    
    # Push to origin and set tracking
    git push -u origin "feature/$branch_name"
    
    success "Created feature branch: feature/$branch_name"
}

# Create subissue branches for each test
create_subissue_branches() {
    local issue_number="$1"
    local branch_name="$2"
    local test_specs=("${@:3}")
    
    if [[ ${#test_specs[@]} -eq 0 ]]; then
        warn "No test specifications found - creating placeholder subissue branch"
        local subissue_branch="test/$issue_number-1-implementation"
        
        git checkout -b "$subissue_branch"
        git push -u origin "$subissue_branch"
        
        success "Created placeholder subissue branch: $subissue_branch"
        return 0
    fi
    
    log "Creating ${#test_specs[@]} subissue branches..."
    
    local subissue_count=1
    for spec in "${test_specs[@]}"; do
        IFS=':' read -r test_type test_desc short_name <<< "$spec"
        
        # Use pre-computed short name
        local subissue_branch="test/$issue_number-$subissue_count-$short_name"
        
        log "Creating subissue branch: $subissue_branch"
        git checkout "feature/$branch_name"
        git checkout -b "$subissue_branch"
        git push -u origin "$subissue_branch"
        
        ((subissue_count++))
    done
    
    # Return to feature branch
    git checkout "feature/$branch_name"
    
    success "Created ${#test_specs[@]} subissue branches"
}

# Create branch tracking file
create_branch_tracking() {
    local issue_number="$1"
    local branch_name="$2"
    local test_specs=("${@:3}")
    
    local tracking_file=".workflo/branch-tracking.json"
    
    # Ensure .workflo directory exists
    mkdir -p .workflo
    
    # Initialize tracking file if it doesn't exist
    if [[ ! -f "$tracking_file" ]]; then
        echo '{}' > "$tracking_file"
    fi
    
    # Create branch tracking entry
    local branch_data
    branch_data=$(jq -n \
        --arg issue "$issue_number" \
        --arg branch "feature/$branch_name" \
        --argjson tests "$(printf '%s\n' "${test_specs[@]}" | jq -R . | jq -s .)" \
        '{
            issue_number: $issue,
            feature_branch: $branch,
            created: now,
            status: "active",
            subissues: $tests | map(split(":") | {type: .[0], description: .[1], short_name: .[2], status: "pending"})
        }')
    
    # Update tracking file
    jq --arg issue "$issue_number" --argjson data "$branch_data" \
        '.[$issue] = $data' "$tracking_file" > "${tracking_file}.tmp" && \
        mv "${tracking_file}.tmp" "$tracking_file"
    
    # Commit tracking file
    git add "$tracking_file"
    git commit -m "$issue_number SETUP: Initialize feature branch tracking

- Created feature branch: feature/$branch_name
- Extracted ${#test_specs[@]} test specifications from issue
- Set up subissue tracking system

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    git push
    
    success "Created branch tracking for issue #$issue_number"
}

# Show help
show_help() {
    echo "Feature Branch Creator with Subissue Tracking"
    echo ""
    echo "Usage: $0 <issue-number>"
    echo ""
    echo "Creates a complete branching structure for a GitHub issue:"
    echo "  - Main feature branch: feature/<issue>-<description>"
    echo "  - Subissue branches: test/<issue>-<num>-<test-description>"
    echo "  - Branch tracking file: .workflo/branch-tracking.json"
    echo ""
    echo "Examples:"
    echo "  $0 123                    # Create branches for issue #123"
    echo ""
    echo "Requirements:"
    echo "  - GitHub CLI authenticated (gh auth login)"
    echo "  - Issue must exist and be accessible"
    echo "  - Must be run from repository root"
    echo ""
    echo "Branch Structure Created:"
    echo "  main"
    echo "  ├── feature/123-commit-validation"
    echo "  │   ├── test/123-1-format-validation"
    echo "  │   ├── test/123-2-phase-validation"
    echo "  │   └── test/123-3-error-handling"
    echo "  └── spike/123-coverage-gaps (created as needed)"
}

# Main execution
if [[ $# -ne 1 ]]; then
    show_help
    exit 1
fi

# Check dependencies
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) is required but not installed"
fi

if ! command -v jq &> /dev/null; then
    error "jq is required but not installed"
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
    error "Must be run from within a git repository"
fi

ISSUE_NUMBER="$1"

# Validate issue number
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    error "Issue number must be a positive integer"
fi

# Check authentication and run
check_auth

# Get issue details and create branch name
log "Processing issue #$ISSUE_NUMBER..."
BRANCH_NAME=$(get_issue_details "$ISSUE_NUMBER")
log "Feature branch name: feature/$BRANCH_NAME"

# Extract test specifications
log "Analyzing issue for test specifications..."
TEST_SPECS=($(extract_test_specifications "$ISSUE_NUMBER"))

if [[ ${#TEST_SPECS[@]} -gt 0 ]]; then
    log "Found ${#TEST_SPECS[@]} test specifications:"
    for spec in "${TEST_SPECS[@]}"; do
        IFS=':' read -r test_type test_desc <<< "$spec"
        echo "  - $test_type: $test_desc"
    done
else
    warn "No test specifications found in issue body"
fi

# Create feature branch structure
create_feature_branch "$ISSUE_NUMBER" "$BRANCH_NAME"
create_subissue_branches "$ISSUE_NUMBER" "$BRANCH_NAME" "${TEST_SPECS[@]}"
create_branch_tracking "$ISSUE_NUMBER" "$BRANCH_NAME" "${TEST_SPECS[@]}"

# Update GitHub board
if [[ -f "$SCRIPT_DIR/gh-board-sync.sh" ]]; then
    log "Updating GitHub project board..."
    "$SCRIPT_DIR/gh-board-sync.sh" start "$ISSUE_NUMBER" >/dev/null 2>&1 || warn "Failed to update project board"
fi

# Run AI-driven parallel development analysis
if [[ -f "$SCRIPT_DIR/ai-parallel-analysis.sh" ]]; then
    log "Running AI-driven parallel development analysis..."
    "$SCRIPT_DIR/ai-parallel-analysis.sh" "$ISSUE_NUMBER" || warn "AI parallel development analysis failed"
fi

echo ""
success "🎉 Feature branch structure created successfully!"
echo ""
echo "📊 **Development Options:**"
echo "  - **Sequential**: Work on subissues one at a time"
echo "  - **Parallel**: Multiple agents can work simultaneously (see analysis)"
echo ""
echo "🚀 **Quick Start Commands:**"
echo "  Single Agent:"
echo "    ./scripts/start-subissue-work.sh $ISSUE_NUMBER 1"
echo ""
echo "  Multiple Agents (AI-optimized parallel development):"
echo "    Check .workflo/ai-parallel-analysis-$ISSUE_NUMBER.md for AI-driven grouping"
echo ""
echo "📁 **Branch Structure:**"
echo "  feature/$BRANCH_NAME (main feature branch)"
for ((i=1; i<=${#TEST_SPECS[@]}; i++)); do
    echo "  ├── test/$ISSUE_NUMBER-$i-... (subissue branch)"
done
echo ""
echo "📋 **Documentation Generated:**"
echo "  - .workflo/branch-tracking.json (branch management)"
echo "  - .workflo/ai-parallel-analysis-$ISSUE_NUMBER.md (AI-driven parallel development guide)"
echo ""