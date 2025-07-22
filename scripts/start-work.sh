#!/bin/bash
# start-work.sh - BLOCKS new work when open PRs exist with CI failures
# This script enforces the MANDATORY PR workflow rule from CLAUDE.md

set -e

# Load workflow libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/workflow-bootstrap.sh"

print_header "MANDATORY PR WORKFLOW CHECK"
echo ""

# Check if GitHub CLI is available and authenticated
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI not found"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null 2>&1; then
    print_error "GitHub CLI not authenticated"
    echo "Run: gh auth login"
    exit 1
fi

# Check for open PRs
print_info "Checking for open PRs..."
OPEN_PRS=$(gh pr list --state open --limit 10)

if [[ -z "$OPEN_PRS" || "$OPEN_PRS" == "no pull requests found" ]]; then
    print_success "No open PRs found - you can start new work"
    echo ""
    print_info "Next steps:"
    echo "  1. Ensure you're on master branch: git checkout master"
    echo "  2. Pull latest changes: git pull origin master"
    echo "  3. Start your work with TDD cycle"
    echo "  4. Use ./scripts/safe-commit.sh for commits"
    echo ""
    exit 0
fi

# Parse PR information (simplified without jq)
PR_COUNT=$(echo "$OPEN_PRS" | wc -l)
print_warning "OPEN PR DETECTED: Found $PR_COUNT open PR(s):"
echo ""

# Show PRs and check their status
FAILING_PRS=0
READY_PRS=0

while IFS=$'\t' read -r pr_number pr_title pr_branch; do
    if [[ -n "$pr_number" ]]; then
        echo "PR #$pr_number: $pr_title"
        echo "   Branch: $pr_branch"
        
        # Check CI status with gh pr checks
        if gh pr checks "$pr_number" --json state,name > /dev/null 2>&1; then
            check_status=$(gh pr checks "$pr_number" 2>/dev/null | grep -c "fail" || echo "0")
            
            if [[ "$check_status" -gt 0 ]]; then
                print_colored "$RED" "   Status: $check_status failing checks"
                ((FAILING_PRS++))
            else
                print_colored "$GREEN" "   Status: All checks passing"
                ((READY_PRS++))
            fi
        else
            echo "   Status: No CI checks found"
        fi
        echo ""
    fi
done <<< "$(echo "$OPEN_PRS" | sed 's/\t/\t/g')"

# Apply decision matrix from CLAUDE.md
if [[ "$FAILING_PRS" -gt 0 ]]; then
    print_error "WORK BLOCKED: $FAILING_PRS PR(s) have failing CI/CD"
    echo ""
    echo "CLAUDE.MD RULE ENFORCEMENT: You MUST fix existing PR failures first"
    echo ""
    print_info "RECOMMENDED ACTION: Fix the existing PR issues first"
    echo ""
    echo "Options:"
    echo "  1. Fix failing CI in existing PRs (Recommended)"
    echo "  2. View PR details: gh pr view <PR-NUMBER> --web"
    echo "  3. Check specific failures: gh pr checks <PR-NUMBER>"
    echo ""
    print_error "Emergency Override: Only if user explicitly approves"
    echo "Continue with new work despite failing PRs? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_error "Work cancelled - fix existing PRs first"
        exit 1
    else
        print_warning "Emergency override activated - proceeding with caution"
    fi
    
elif [[ "$READY_PRS" -gt 0 ]]; then
    print_warning "READY PRs DETECTED: $READY_PRS PR(s) ready for merge"
    echo ""
    echo "CLAUDE.MD RULE: Address ready PRs before creating new ones"
    echo ""
    print_info "RECOMMENDED ACTION: Merge ready PRs first"
    echo ""
    echo "What would you like to do?"
    echo "  1. Merge ready PRs first (Recommended)"
    echo "  2. Start new work anyway"
    echo ""
    echo "Choose (1/2): "
    read -r choice
    
    if [[ "$choice" == "1" ]]; then
        echo ""
        print_info "To merge PRs:"
        for i in $(seq 0 $((PR_COUNT - 1))); do
            PR_NUMBER=$(echo "$OPEN_PRS" | jq -r ".[$i].number")
            echo "  gh pr merge $PR_NUMBER --squash"
        done
        print_error "Work blocked - merge existing PRs first"
        exit 1
    else
        print_warning "Proceeding with new work despite ready PRs"
    fi
    
else
    print_warning "PENDING PRs: All open PRs have pending CI checks"
    echo ""
    print_info "QUESTION: Should I:"
    echo "  1. Wait for CI to complete first? (Recommended)"
    echo "  2. Start new work anyway? (Requires explicit approval)"
    echo ""
    echo "Choose (1/2): "
    read -r choice
    
    if [[ "$choice" == "1" ]]; then
        print_info "Waiting for CI completion is recommended"
        print_info "Monitor CI: gh pr checks <PR-NUMBER>"
        exit 1
    else
        print_warning "Starting new work with pending CI checks"
    fi
fi

# If we reach here, user has explicitly chosen to proceed
echo ""
print_success "Starting new work (with user approval)"
echo ""
print_info "Workflow reminders:"
echo "  • Stay on master branch for all development"
echo "  • Use ./scripts/safe-commit.sh for commits"
echo "  • Remember: work is NOT complete until CI passes"
echo "  • Monitor existing PRs: gh pr list --state open"
echo ""
print_warning "IMPORTANT: Fix existing PR failures as soon as possible"