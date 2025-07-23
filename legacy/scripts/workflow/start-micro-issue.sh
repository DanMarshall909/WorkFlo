#!/bin/bash

# start-micro-issue.sh - Start working on micro-issues with progressive disclosure
# Usage: ./scripts/workflow/start-micro-issue.sh <issue_number>

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MICRO_ISSUES_DIR="$PROJECT_ROOT/.workflo/micro-issues"

log() {
    echo -e "${BLUE}[MICRO-ISSUE]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Check prerequisites
check_prereqs() {
    if ! command -v jq >/dev/null 2>&1; then
        error "jq not found. Install with: sudo apt-get install jq"
    fi
}

# Load micro-issue data
load_micro_issue_data() {
    local issue_number="$1"
    local micro_issue_file="$MICRO_ISSUES_DIR/issue-$issue_number.json"
    
    if [[ ! -f "$micro_issue_file" ]]; then
        error "Micro-issues not found for issue #$issue_number. Run: ./scripts/workflow/decompose-issue.sh $issue_number"
    fi
    
    echo "$micro_issue_file"
}

# Get current micro-issue to work on
get_current_micro_issue() {
    local micro_issue_file="$1"
    
    # Find the first visible, non-completed micro-issue
    local current_id
    current_id=$(jq -r '.micro_issues[] | select(.status != "COMPLETED" and .visibility == "VISIBLE") | .id' "$micro_issue_file" | head -1)
    
    if [[ -z "$current_id" || "$current_id" == "null" ]]; then
        return 1
    fi
    
    echo "$current_id"
}

# Get micro-issue details
get_micro_issue_details() {
    local micro_issue_file="$1"
    local micro_issue_id="$2"
    
    jq -r --arg id "$micro_issue_id" '.micro_issues[] | select(.id == $id)' "$micro_issue_file"
}

# Check if all micro-issues are completed
check_completion_status() {
    local micro_issue_file="$1"
    
    local total_count
    total_count=$(jq -r '.total_micro_issues' "$micro_issue_file")
    
    local completed_count
    completed_count=$(jq -r '.micro_issues[] | select(.status == "COMPLETED") | .id' "$micro_issue_file" | wc -l)
    
    if [[ "$completed_count" -eq "$total_count" ]]; then
        return 0  # All completed
    else
        return 1  # More work to do
    fi
}

# Set up environment for micro-issue work
setup_micro_issue_environment() {
    local issue_number="$1"
    local micro_issue_id="$2"
    local micro_issue_data="$3"
    
    # Set environment variables for TDD scripts
    export WORKFLO_CURRENT_ISSUE="$issue_number"
    export WORKFLO_CURRENT_MICRO_ISSUE="$micro_issue_id"
    export WORKFLO_MICRO_ISSUE_MODE="true"
    
    # Extract test details
    local test_name
    test_name=$(echo "$micro_issue_data" | jq -r '.test_name')
    
    local description
    description=$(echo "$micro_issue_data" | jq -r '.description')
    
    export WORKFLO_CURRENT_TEST_NAME="$test_name"
    export WORKFLO_CURRENT_TEST_DESCRIPTION="$description"
    
    # Create session file for TDD scripts to reference
    local session_file="$PROJECT_ROOT/.workflo/current-session.json"
    cat > "$session_file" << EOF
{
  "issue_number": $issue_number,
  "micro_issue_id": "$micro_issue_id",
  "test_name": "$test_name",
  "description": "$description",
  "started_at": "$(date -Iseconds)",
  "environment_vars": {
    "WORKFLO_CURRENT_ISSUE": "$issue_number",
    "WORKFLO_CURRENT_MICRO_ISSUE": "$micro_issue_id",
    "WORKFLO_MICRO_ISSUE_MODE": "true",
    "WORKFLO_CURRENT_TEST_NAME": "$test_name",
    "WORKFLO_CURRENT_TEST_DESCRIPTION": "$description"
  }
}
EOF
    
    success "Environment set up for micro-issue $micro_issue_id"
}

# Show current micro-issue details
show_current_micro_issue() {
    local issue_number="$1"
    local micro_issue_data="$2"
    
    local micro_issue_id
    micro_issue_id=$(echo "$micro_issue_data" | jq -r '.id')
    
    local test_name
    test_name=$(echo "$micro_issue_data" | jq -r '.test_name')
    
    local description
    description=$(echo "$micro_issue_data" | jq -r '.description')
    
    local type
    type=$(echo "$micro_issue_data" | jq -r '.type')
    
    echo ""
    echo -e "${CYAN}🎯 Current Micro-Issue${NC}"
    echo -e "${CYAN}=====================${NC}"
    echo ""
    echo -e "${BLUE}Issue:${NC} #$issue_number"
    echo -e "${BLUE}Micro-Issue:${NC} $micro_issue_id"
    echo -e "${BLUE}Type:${NC} $type"
    echo -e "${BLUE}Test Name:${NC} $test_name"
    echo -e "${BLUE}Description:${NC} $description"
    echo ""
    
    # Show TDD workflow guidance
    echo -e "${GREEN}🔄 TDD Workflow:${NC}"
    echo "  1. RED: Write failing test for this scenario"
    echo "  2. GREEN: Implement minimal code to pass test"  
    echo "  3. REFACTOR: Improve code while keeping tests green"
    echo "  4. COVER: Add comprehensive test coverage"
    echo ""
    echo -e "${GREEN}📝 Commands:${NC}"
    echo "  Start RED phase:    ./scripts/tdd/tdd-micro-cycle.sh RED"
    echo "  Continue to GREEN:  ./scripts/tdd/tdd-micro-cycle.sh GREEN"
    echo "  Continue to REFACTOR: ./scripts/tdd/tdd-micro-cycle.sh REFACTOR"
    echo "  Complete with COVER: ./scripts/tdd/tdd-micro-cycle.sh COVER"
    echo ""
    echo -e "${YELLOW}⚠️  Focus Constraint:${NC}"
    echo "  - Work ONLY on this test scenario"
    echo "  - Do not implement additional functionality"
    echo "  - Future micro-issues are hidden until this is complete"
}

# Update progress tracking
update_progress() {
    local issue_number="$1"
    
    local progress_file="$PROJECT_ROOT/PROGRESS.md"
    local timestamp=$(date '+%a %b %d %H:%M:%S AEST %Y')
    
    # Create or update progress entry
    if [[ -f "$progress_file" ]]; then
        # Update existing progress
        sed -i "1s/.*/Current Issue: #$issue_number - Micro-Issue Workflow/" "$progress_file"
        sed -i "2s/.*/Status: 🔄 IN_PROGRESS/" "$progress_file"
        sed -i "3s/.*/Started: $timestamp/" "$progress_file"
    else
        # Create new progress file
        cat > "$progress_file" << EOF
Current Issue: #$issue_number - Micro-Issue Workflow
Status: 🔄 IN_PROGRESS
Started: $timestamp

## Micro-Issue Progress
Working on atomic test scenarios with progressive disclosure.
Use ./scripts/workflow/show-micro-progress.sh $issue_number to see detailed progress.
EOF
    fi
}

# Main workflow
main() {
    local issue_number="${1:-}"
    
    if [[ -z "$issue_number" ]]; then
        error "Usage: $0 <issue_number>"
    fi
    
    log "🚀 Starting micro-issue work for issue #$issue_number"
    
    # Check prerequisites
    check_prereqs
    
    # Load micro-issue data
    local micro_issue_file
    micro_issue_file=$(load_micro_issue_data "$issue_number")
    
    # Check if all micro-issues are completed
    if check_completion_status "$micro_issue_file"; then
        success "🎉 All micro-issues completed for issue #$issue_number!"
        echo ""
        echo -e "${GREEN}Next steps:${NC}"
        echo "  1. Review all changes: git log --oneline"
        echo "  2. Run quality check: ./scripts/quality/pr-quality-check.sh"
        echo "  3. Create PR: gh pr create --base master"
        return 0
    fi
    
    # Get current micro-issue
    local current_micro_issue_id
    if ! current_micro_issue_id=$(get_current_micro_issue "$micro_issue_file"); then
        error "No available micro-issues found. All visible micro-issues may be completed."
    fi
    
    # Get micro-issue details
    local micro_issue_data
    micro_issue_data=$(get_micro_issue_details "$micro_issue_file" "$current_micro_issue_id")
    
    # Set up environment
    setup_micro_issue_environment "$issue_number" "$current_micro_issue_id" "$micro_issue_data"
    
    # Show current micro-issue
    show_current_micro_issue "$issue_number" "$micro_issue_data"
    
    # Update progress tracking
    update_progress "$issue_number"
    
    success "Ready to start TDD cycle for micro-issue $current_micro_issue_id"
    
    # Provide immediate next step
    echo ""
    echo -e "${CYAN}🔥 Ready to Begin:${NC}"
    echo "Run: ./scripts/tdd/tdd-micro-cycle.sh RED"
}

# Handle help
case "${1:-}" in
    "help"|"--help"|"-h")
        echo "Micro-Issue Progressive Disclosure Workflow"
        echo ""
        echo "Usage: $0 <issue_number>"
        echo ""
        echo "Starts work on the next available micro-issue with progressive disclosure."
        echo "Only shows one micro-issue at a time to maintain focus."
        echo ""
        echo "Examples:"
        echo "  $0 123        # Start micro-issue work for issue #123"
        echo "  $0 --help     # Show this help"
        echo ""
        echo "Prerequisites:"
        echo "  1. Issue must be decomposed: ./scripts/workflow/decompose-issue.sh 123"
        echo "  2. Git repository must be clean"
        echo "  3. Feature branch should be created for the issue"
        ;;
    *)
        main "$@"
        ;;
esac