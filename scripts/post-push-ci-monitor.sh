#!/bin/bash
# Post-push CI monitoring hook
# Monitors CI status after pushing to ensure work isn't considered "done" until CI passes
# Install with: cp scripts/pos  t-push-ci-monitor.sh .git/hooks/post-commit && chmod +x .git/hooks/post-commit

set -e

# Configuration
BRANCH=$(git symbolic-ref HEAD | sed 's|refs/heads/||')
REPO=$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')
CHECK_INTERVAL=30  # seconds between CI checks
MAX_WAIT_TIME=300  # 5 minutes max wait
REQUIRE_CI_SUCCESS=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🔄 $1${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..60})${NC}"
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    print_warning "GitHub CLI (gh) not found. CI monitoring skipped."
    print_info "Install with: https://cli.github.com/"
    exit 0
fi

# Check if we're authenticated with GitHub
if ! gh auth status &> /dev/null; then
    print_warning "Not authenticated with GitHub CLI. CI monitoring skipped."
    print_info "Authenticate with: gh auth login"
    exit 0
fi

print_header "Post-Push CI Monitoring"
print_info "Branch: $BRANCH"
print_info "Repository: $REPO"

# Only monitor CI for dev branch (where PRs originate)
if [[ "$BRANCH" != "dev" ]]; then
    print_info "Not on dev branch. CI monitoring skipped."
    exit 0
fi

# Check if there's an open PR for this branch
print_info "Checking for open PR..."
PR_NUMBER=$(gh pr list --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")

if [[ -z "$PR_NUMBER" ]]; then
    print_warning "No open PR found for branch '$BRANCH'"
    print_info "Create a PR when ready: gh pr create --base main --head dev"
    print_info "Or manually: https://github.com/$REPO/compare/main...$BRANCH"
    exit 0
fi

print_success "Found PR #$PR_NUMBER"

# Function to check CI status
check_ci_status() {
    local pr_number=$1
    local status_output

    # Get CI status using gh pr checks
    status_output=$(gh pr checks "$pr_number" 2>/dev/null || echo "ERROR")

    if [[ "$status_output" == "ERROR" ]]; then
        echo "ERROR"
        return 1
    fi

    # Count failures, pending, and total checks
    local failing_count=$(echo "$status_output" | grep -c "fail" 2>/dev/null || echo "0")
    local pending_count=$(echo "$status_output" | grep -c "pending\|in_progress\|queued" 2>/dev/null || echo "0")
    local total_count=$(echo "$status_output" | grep -c "." 2>/dev/null || echo "0")  # Count non-empty lines
    
    # Ensure variables are numbers and strip whitespace
    failing_count=$(echo "${failing_count:-0}" | tr -d '[:space:]')
    pending_count=$(echo "${pending_count:-0}" | tr -d '[:space:]')
    total_count=$(echo "${total_count:-0}" | tr -d '[:space:]')
    
    # Validate numbers
    [[ "$failing_count" =~ ^[0-9]+$ ]] || failing_count=0
    [[ "$pending_count" =~ ^[0-9]+$ ]] || pending_count=0  
    [[ "$total_count" =~ ^[0-9]+$ ]] || total_count=0
    
    local passing_count=$((total_count - failing_count - pending_count))

    echo "$failing_count:$pending_count:$passing_count:$total_count"
}

# Function to display CI summary
display_ci_summary() {
    local status=$1
    IFS=':' read -r failing pending passing total <<< "$status"

    echo ""
    print_info "CI Status Summary:"
    echo "  🔴 Failing: $failing"
    echo "  🟡 Pending: $pending"
    echo "  🟢 Passing: $passing"
    echo "  📊 Total: $total"
}

# Function to show detailed failures
show_failures() {
    local pr_number=$1
    print_error "CI Failures detected. Details:"
    echo ""

    # Show only failing checks
    gh pr checks "$pr_number" 2>/dev/null | grep "fail" | while read -r line; do
        echo "  ❌ $line"
    done

    echo ""
    print_info "View full details: gh pr view $pr_number --web"
}

# Monitor CI status
print_info "Monitoring CI status for PR #$PR_NUMBER..."
start_time=$(date +%s)
first_check=true

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))

    # Check if we've exceeded max wait time
    if [[ $elapsed -gt $MAX_WAIT_TIME ]]; then
        print_warning "Maximum wait time ($MAX_WAIT_TIME seconds) exceeded"
        break
    fi

    # Get CI status
    ci_status=$(check_ci_status "$PR_NUMBER")

    if [[ "$ci_status" == "ERROR" ]]; then
        print_error "Failed to get CI status. Exiting monitor."
        exit 1
    fi

    IFS=':' read -r failing pending passing total <<< "$ci_status"

    # Display status
    if [[ "$first_check" == "true" ]]; then
        display_ci_summary "$ci_status"
        first_check=false
    else
        echo -ne "\r⏳ Checking CI... Failing: $failing, Pending: $pending, Passing: $passing/$total"
    fi

    # Check if CI is complete
    if [[ $pending -eq 0 ]]; then
        echo "" # New line after progress indicator

        if [[ $failing -eq 0 ]]; then
            echo ""
            print_success "🎉 All CI checks passed!"
            print_success "PR #$PR_NUMBER is ready for review/merge"
            print_info "View PR: gh pr view $PR_NUMBER --web"
            exit 0
        else
            echo ""
            print_error "❌ CI checks failed!"
            show_failures "$PR_NUMBER"

            if [[ "$REQUIRE_CI_SUCCESS" == "true" ]]; then
                print_error "Work is NOT complete until CI passes"
                print_info "Fix the issues above and push again"
                exit 1
            else
                print_warning "CI failures detected but not enforced"
                exit 0
            fi
        fi
    fi

    # Wait before next check
    sleep $CHECK_INTERVAL
done

# If we exit the loop, CI is still pending
echo ""
print_warning "CI checks still pending after $MAX_WAIT_TIME seconds"
print_info "Continue monitoring: gh pr checks $PR_NUMBER --watch"
print_info "View PR: gh pr view $PR_NUMBER --web"

if [[ "$REQUIRE_CI_SUCCESS" == "true" ]]; then
    print_warning "Remember: Work is NOT complete until CI passes!"
fi

exit 0
