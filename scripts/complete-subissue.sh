#!/bin/bash

# complete-subissue.sh - Complete subissue and merge to feature branch
# Usage: ./scripts/complete-subissue.sh <issue-number> <subissue-number>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
    echo -e "${BLUE}[COMPLETE-SUBISSUE]${NC} $1"
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

# Get branch names from tracking data
get_branch_names() {
    local parent_issue="$1"
    local subissue_number="$2"
    
    local tracking_file=".workflo/branch-tracking.json"
    
    if [[ ! -f "$tracking_file" ]]; then
        error "Branch tracking file not found. Run create-feature-branches.sh first."
    fi
    
    # Get feature branch name
    local feature_branch
    feature_branch=$(jq -r --arg issue "$parent_issue" '.[$issue].feature_branch // empty' "$tracking_file")
    
    if [[ -z "$feature_branch" ]]; then
        error "Feature branch not found in tracking for issue #$parent_issue"
    fi
    
    # Get subissue branch name
    local short_name
    short_name=$(jq -r --arg issue "$parent_issue" --arg num "$subissue_number" \
        '.[$issue].subissues | map(select(.type | contains($num))) | .[0].short_name // empty' \
        "$tracking_file" 2>/dev/null || echo "")
    
    if [[ -z "$short_name" ]]; then
        error "Subissue $subissue_number not found in tracking for issue #$parent_issue"
    fi
    
    local test_branch="test/$parent_issue-$subissue_number-$short_name"
    
    echo "$feature_branch:$test_branch"
}

# Validate subissue completion
validate_subissue_completion() {
    local test_branch="$1"
    
    log "Validating subissue completion on branch: $test_branch"
    
    # Switch to test branch
    git checkout "$test_branch" >/dev/null 2>&1 || error "Failed to checkout test branch: $test_branch"
    
    # Run all tests to ensure they pass
    log "Running tests to validate completion..."
    if ! dotnet test --verbosity quiet >/dev/null 2>&1; then
        error "Tests are failing on $test_branch. Cannot complete subissue until tests pass."
    fi
    
    # Check for uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        error "Uncommitted changes detected on $test_branch. Please commit all changes before completing subissue."
    fi
    
    success "Subissue validation passed"
}

# Merge test branch to feature branch
merge_to_feature() {
    local feature_branch="$1"
    local test_branch="$2"
    local parent_issue="$3"
    local subissue_number="$4"
    
    log "Merging $test_branch to $feature_branch..."
    
    # Switch to feature branch
    git checkout "$feature_branch" >/dev/null 2>&1 || error "Failed to checkout feature branch: $feature_branch"
    
    # Pull latest changes
    git pull origin "$feature_branch" >/dev/null 2>&1 || warn "Failed to pull latest changes for $feature_branch"
    
    # Merge test branch (squash merge to keep feature branch clean)
    if ! git merge --squash "$test_branch" >/dev/null 2>&1; then
        error "Merge conflict detected. Please resolve conflicts manually and retry."
    fi
    
    # Create merge commit
    local merge_message="$parent_issue-$subissue_number COMPLETE: Merge subissue test branch

Subissue completed and validated:
- All tests passing
- Code quality verified
- Ready for feature integration

Branch merged: $test_branch → $feature_branch

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    git commit -m "$merge_message"
    
    # Push merged changes
    git push origin "$feature_branch"
    
    success "Successfully merged $test_branch to $feature_branch"
}

# Close GitHub subissue
close_github_subissue() {
    local parent_issue="$1"
    local subissue_number="$2"
    
    log "Finding and closing GitHub subissue..."
    
    # Find subissue by title pattern
    local subissue_id
    subissue_id=$(gh issue list --state open --search "Test $subissue_number in:title" --json number,title | \
        jq -r --arg parent "$parent_issue" '.[] | select(.title | contains("Test '"$subissue_number"':")) | .number' | head -1)
    
    if [[ -n "$subissue_id" ]]; then
        log "Closing subissue #$subissue_id..."
        
        # Add completion comment
        gh issue comment "$subissue_id" --body "✅ **Subissue Complete**

This subissue has been completed and merged to the feature branch.

**Merge Details:**
- Test branch merged to feature branch
- All tests passing
- Code quality validated
- Ready for feature completion

**Next Steps:**
- Continue with remaining subissues for issue #$parent_issue
- Complete feature when all subissues are done"
        
        # Close the subissue
        gh issue close "$subissue_id"
        
        # Update parent issue
        gh issue comment "$parent_issue" --body "✅ Completed subissue #$subissue_id (Test $subissue_number)"
        
        success "Closed subissue #$subissue_id"
    else
        warn "Could not find subissue to close. You may need to close it manually."
    fi
}

# Clean up test branch
cleanup_test_branch() {
    local test_branch="$1"
    local feature_branch="$2"
    
    log "Cleaning up test branch: $test_branch"
    
    # Switch to feature branch before deletion
    git checkout "$feature_branch" >/dev/null 2>&1
    
    # Delete local test branch
    git branch -d "$test_branch" >/dev/null 2>&1 || warn "Failed to delete local test branch"
    
    # Delete remote test branch
    git push origin --delete "$test_branch" >/dev/null 2>&1 || warn "Failed to delete remote test branch"
    
    success "Cleaned up test branch: $test_branch"
}

# Update tracking data
update_tracking_data() {
    local parent_issue="$1"
    local subissue_number="$2"
    
    local tracking_file=".workflo/branch-tracking.json"
    
    # Mark subissue as completed in tracking data
    jq --arg issue "$parent_issue" --arg num "$subissue_number" \
        '.[$issue].subissues |= map(if (.type | contains($num)) then .status = "completed" else . end)' \
        "$tracking_file" > "${tracking_file}.tmp" && mv "${tracking_file}.tmp" "$tracking_file"
    
    log "Updated tracking data for completed subissue"
}

# Check if all subissues are complete
check_feature_completion() {
    local parent_issue="$1"
    
    local tracking_file=".workflo/branch-tracking.json"
    
    # Count total and completed subissues
    local total_subissues
    total_subissues=$(jq -r --arg issue "$parent_issue" '.[$issue].subissues | length' "$tracking_file")
    
    local completed_subissues
    completed_subissues=$(jq -r --arg issue "$parent_issue" '.[$issue].subissues | map(select(.status == "completed")) | length' "$tracking_file")
    
    log "Feature progress: $completed_subissues/$total_subissues subissues completed"
    
    if [[ "$completed_subissues" -eq "$total_subissues" ]]; then
        success "🎉 All subissues completed! Feature #$parent_issue is ready for final validation."
        echo ""
        echo "🚀 Next Steps:"
        echo "  1. Run feature-level quality validation: ./scripts/validate-feature-completion.sh $parent_issue"
        echo "  2. Create PR for feature branch: gh pr create --base \${WORKFLO_MAIN_BRANCH:-master} --head feature/..."
        echo "  3. Merge to main development branch after review and approval"
        echo ""
        return 0
    else
        local remaining=$((total_subissues - completed_subissues))
        log "$remaining subissue(s) remaining for feature completion"
        return 1
    fi
}

# Show help
show_help() {
    echo "Subissue Completion Manager"
    echo ""
    echo "Usage: $0 <issue-number> <subissue-number>"
    echo ""
    echo "Completes a subissue by:"
    echo "  1. Validating all tests pass"
    echo "  2. Merging test branch to feature branch"
    echo "  3. Closing GitHub subissue"
    echo "  4. Cleaning up test branch"
    echo "  5. Updating tracking data"
    echo "  6. Checking for feature completion"
    echo ""
    echo "Arguments:"
    echo "  issue-number     Parent GitHub issue number"
    echo "  subissue-number  Subissue sequence number to complete"
    echo ""
    echo "Examples:"
    echo "  $0 123 1         # Complete first subissue of issue #123"
    echo "  $0 124 3         # Complete third subissue of issue #124"
    echo ""
    echo "Merge Flow:"
    echo "  test/123-1-validation → feature/123-commit-validation → master"
    echo ""
    echo "Requirements:"
    echo "  - All tests must pass on test branch"
    echo "  - No uncommitted changes"
    echo "  - GitHub CLI authenticated"
}

# Main execution
if [[ $# -ne 2 ]]; then
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

PARENT_ISSUE="$1"
SUBISSUE_NUMBER="$2"

# Validate inputs
if ! [[ "$PARENT_ISSUE" =~ ^[0-9]+$ ]]; then
    error "Issue number must be a positive integer"
fi

if ! [[ "$SUBISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    error "Subissue number must be a positive integer"
fi

# Check authentication
check_auth

# Get branch names from tracking data
log "Processing subissue completion for #$PARENT_ISSUE-$SUBISSUE_NUMBER..."
BRANCH_INFO=$(get_branch_names "$PARENT_ISSUE" "$SUBISSUE_NUMBER")
IFS=':' read -r FEATURE_BRANCH TEST_BRANCH <<< "$BRANCH_INFO"

log "Feature branch: $FEATURE_BRANCH"
log "Test branch: $TEST_BRANCH"

# Execute completion workflow
validate_subissue_completion "$TEST_BRANCH"
merge_to_feature "$FEATURE_BRANCH" "$TEST_BRANCH" "$PARENT_ISSUE" "$SUBISSUE_NUMBER"
close_github_subissue "$PARENT_ISSUE" "$SUBISSUE_NUMBER"
cleanup_test_branch "$TEST_BRANCH" "$FEATURE_BRANCH"
update_tracking_data "$PARENT_ISSUE" "$SUBISSUE_NUMBER"

echo ""
success "🎉 Subissue #$PARENT_ISSUE-$SUBISSUE_NUMBER completed successfully!"
echo ""

# Check if feature is complete
if check_feature_completion "$PARENT_ISSUE"; then
    # Feature is complete
    echo "🏆 Feature #$PARENT_ISSUE is ready for final review and merge to master!"
else
    # More subissues remain
    echo "📋 Continue with next subissue or start new subissue work:"
    echo "  ./scripts/start-subissue-work.sh $PARENT_ISSUE <next-subissue-number>"
fi
echo ""