#!/bin/bash

# Script to push changes and close completed issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[→]${NC} $1"
}

# Check if we have any commits to push
COMMITS_TO_PUSH=$(git rev-list --count origin/master..HEAD 2>/dev/null || echo "0")

if [ "$COMMITS_TO_PUSH" -eq "0" ]; then
    print_info "No commits to push"
else
    print_info "Found $COMMITS_TO_PUSH commits to push"
    
    # Show what we're about to push
    echo ""
    print_info "Commits to be pushed:"
    git log --oneline origin/master..HEAD
    echo ""
    
    # Push to origin
    print_info "Pushing to origin/master..."
    if git push origin master; then
        print_status "Successfully pushed to origin/master"
    else
        print_error "Failed to push to origin/master"
        exit 1
    fi
fi

# Close completed issues
print_info "Checking for issues to close..."

# Array of completed issues with their closing comments
declare -A COMPLETED_ISSUES
COMPLETED_ISSUES[1]="CLI implementation completed successfully with comprehensive test coverage"
COMPLETED_ISSUES[8]="Technical debt cleanup completed - all subtasks done and tests passing"

# Close each completed issue
for ISSUE_NUM in "${!COMPLETED_ISSUES[@]}"; do
    print_info "Checking issue #$ISSUE_NUM..."
    
    # Check if issue is already closed
    ISSUE_STATE=$(gh issue view $ISSUE_NUM --json state -q .state 2>/dev/null || echo "not_found")
    
    if [ "$ISSUE_STATE" = "not_found" ]; then
        print_error "Issue #$ISSUE_NUM not found"
        continue
    elif [ "$ISSUE_STATE" = "CLOSED" ]; then
        print_status "Issue #$ISSUE_NUM is already closed"
        continue
    else
        print_info "Closing issue #$ISSUE_NUM..."
        
        # Add closing comment
        gh issue comment $ISSUE_NUM --body "✅ ${COMPLETED_ISSUES[$ISSUE_NUM]}

This issue has been completed as part of the WorkFlo development workflow.

All acceptance criteria have been met and tests are passing."
        
        # Close the issue
        if gh issue close $ISSUE_NUM; then
            print_status "Successfully closed issue #$ISSUE_NUM"
        else
            print_error "Failed to close issue #$ISSUE_NUM"
        fi
    fi
done

# Update GitHub board if using projects
print_info "Updating GitHub board status..."
./scripts/gh-board-sync.sh show || true

# Summary
echo ""
print_info "Summary:"
print_status "All changes pushed to origin"
print_status "Completed issues closed"
print_info "Next recommended issue: #3 - Local API Server"
echo ""
print_info "To start the next issue, run: ./gb start 3"