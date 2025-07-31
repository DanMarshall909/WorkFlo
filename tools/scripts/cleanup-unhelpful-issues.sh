#!/bin/bash

# Script to identify and remove unhelpful GitHub issues
# Targets issues with generic placeholder content like issue #200

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed or not in PATH${NC}"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Function to check if an issue is unhelpful
is_unhelpful_issue() {
    local issue_body="$1"
    local issue_title="$2"
    
    # Check for common patterns of unhelpful issues
    if [[ "$issue_body" =~ "Issue created in non-interactive mode" ]] || \
       [[ "$issue_body" =~ "Default acceptance criterion" ]] || \
       [[ "$issue_title" =~ "Non-interactive Issue" ]] || \
       [[ "$issue_body" =~ ^[[:space:]]*$ ]]; then
        return 0  # Is unhelpful
    fi
    
    return 1  # Is not unhelpful
}

# Dry run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}Running in dry-run mode - no issues will be deleted${NC}"
fi

echo "Fetching open issues..."

# Get all open issues as JSON
issues_json=$(gh issue list --state open --json number,title,body --limit 1000)

# Parse issues and identify unhelpful ones
unhelpful_issues=()

while IFS= read -r issue; do
    number=$(echo "$issue" | jq -r '.number')
    title=$(echo "$issue" | jq -r '.title')
    body=$(echo "$issue" | jq -r '.body')
    
    if is_unhelpful_issue "$body" "$title"; then
        unhelpful_issues+=("$number")
        echo -e "${YELLOW}Found unhelpful issue #$number: $title${NC}"
    fi
done < <(echo "$issues_json" | jq -c '.[]')

if [[ ${#unhelpful_issues[@]} -eq 0 ]]; then
    echo -e "${GREEN}No unhelpful issues found${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Found ${#unhelpful_issues[@]} unhelpful issue(s)${NC}"

if [[ "$DRY_RUN" == "true" ]]; then
    echo "Would delete the following issues:"
    for issue_num in "${unhelpful_issues[@]}"; do
        echo "  - Issue #$issue_num"
    done
    exit 0
fi

# Confirm deletion
echo -e "${RED}WARNING: This will permanently delete the following issues:${NC}"
for issue_num in "${unhelpful_issues[@]}"; do
    echo "  - Issue #$issue_num"
done

read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 0
fi

# Delete unhelpful issues
deleted_count=0
for issue_num in "${unhelpful_issues[@]}"; do
    echo "Deleting issue #$issue_num..."
    if gh issue delete "$issue_num" --yes; then
        echo -e "${GREEN}✓ Deleted issue #$issue_num${NC}"
        ((deleted_count++))
    else
        echo -e "${RED}✗ Failed to delete issue #$issue_num${NC}"
    fi
done

echo -e "\n${GREEN}Successfully deleted $deleted_count unhelpful issue(s)${NC}"