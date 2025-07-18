#!/bin/bash

# Enhanced Start Work Script with GitHub Board Integration
# Combines issue selection, board management, and progress tracking
# Usage: ./sw [issue_number]

set -euo pipefail

# Check for direct issue number parameter
DIRECT_ISSUE_NUMBER="${1:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[START-WORK]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

fatal_error() {
    echo -e "${RED}[FATAL]${NC} $1" >&2
    exit 1
}

# Check prerequisites
check_prereqs() {
    if ! command -v gh >/dev/null 2>&1; then
        error "GitHub CLI (gh) not found. Install from: https://cli.github.com/"
    fi
    
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI not authenticated. Run 'gh auth login' first."
    fi
    
    if ! git status >/dev/null 2>&1; then
        error "Not in a git repository"
    fi
    
    # Ensure we're on dev branch
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "dev" ]]; then
        warn "Not on dev branch. Switching to dev..."
        git checkout dev
        git pull origin dev
    fi
}

# Show current progress and ask to continue or start new
check_current_progress() {
    if [[ -f "PROGRESS.md" ]]; then
        echo ""
        echo -e "${CYAN}📋 Current Progress:${NC}"
        cat PROGRESS.md
        echo ""
        
        read -p "Continue current work? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Extract current issue number from PROGRESS.md
            current_issue=$(grep -o "#[0-9]\+" PROGRESS.md | head -1 | sed 's/#//')
            if [[ -n "$current_issue" ]]; then
                log "Continuing work on issue #$current_issue"
                return 0
            fi
        fi
    fi
    return 1
}

# Create a new issue interactively
create_new_issue() {
    read -p "Enter issue title: " title
    read -p "Enter issue description: " description
    
    local new_issue
    new_issue=$(gh issue create --title "$title" --body "$description")
    local issue_number
    issue_number=$(echo "$new_issue" | grep -o "#[0-9]\+" | sed 's/#//')
    
    success "Created new issue #$issue_number"
    echo "$issue_number"
}

# Show available issues and let user select
select_issue() {
    # If direct issue number provided, validate and use it
    if [[ -n "$DIRECT_ISSUE_NUMBER" ]]; then
        if [[ "$DIRECT_ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
            log "Using provided issue #$DIRECT_ISSUE_NUMBER" >&2
            echo "$DIRECT_ISSUE_NUMBER"
            return
        else
            fatal_error "Invalid issue number: $DIRECT_ISSUE_NUMBER"
        fi
    fi
    
    log "Fetching available issues..."
    
    # Get open issues
    local issues
    issues=$(gh issue list --state open --json number,title,labels | jq -r '.[] | "\(.number)|\(.title)|\(.labels[].name // "")"')
    
    if [[ -z "$issues" ]]; then
        warn "No open issues found. Creating a new issue..."
        create_new_issue
        return
    fi
    
    echo ""
    echo -e "${CYAN}📋 Available Issues:${NC}"
    echo ""
    
    local counter=1
    declare -A issue_map
    
    while IFS='|' read -r number title labels; do
        echo -e "$counter) ${GREEN}#$number${NC}: $title"
        if [[ -n "$labels" ]]; then
            echo "   Labels: $labels"
        fi
        issue_map[$counter]=$number
        ((counter++))
        echo ""
    done <<< "$issues"
    
    echo "0) Create new issue"
    echo ""
    
    # Interactive selection with timeout protection
    local attempts=0
    local max_attempts=3
    
    while [[ $attempts -lt $max_attempts ]]; do
        read -t 30 -p "Select issue (1-$((counter-1)) or 0): " -r selection 2>/dev/null || {
            error "Input timeout or error. Use: ./sw <issue_number> for non-interactive mode"
            exit 1
        }
        
        # Validate input
        if [[ ! "$selection" =~ ^[0-9]+$ ]]; then
            error "Invalid selection: must be a number"
            ((attempts++))
            continue
        fi
        
        if [[ "$selection" == "0" ]]; then
            create_new_issue
            return
        elif [[ "$selection" -ge 1 && "$selection" -lt "$counter" && -n "${issue_map[$selection]:-}" ]]; then
            echo "${issue_map[$selection]}"
            return
        else
            error "Invalid selection: must be between 0 and $((counter-1))"
            ((attempts++))
            continue
        fi
    done
    
    error "Too many invalid attempts. Use: ./sw <issue_number> for direct selection"
    exit 1
}

# Start progress tracker
start_tracking() {
    log "Starting progress tracker..."
    if [[ -f "./scripts/start-progress-tracker.sh" ]]; then
        ./scripts/start-progress-tracker.sh >/dev/null 2>&1 &
        success "Progress tracker started"
    else
        warn "Progress tracker script not found, skipping..."
    fi
}

# Main workflow
main() {
    echo -e "${CYAN}🚀 Enhanced Start Work - GitHub Board Integration${NC}"
    echo "=================================================="
    
    # Check prerequisites
    check_prereqs
    
    # Check if continuing current work
    if check_current_progress; then
        success "Continuing current work session"
        exit 0
    fi
    
    # Select issue to work on
    log "Select an issue to work on..."
    local issue_number
    issue_number=$(select_issue)
    
    if [[ -z "$issue_number" ]]; then
        error "No issue selected"
    fi
    
    # Show issue details
    echo ""
    log "Issue details:"
    gh issue view "$issue_number"
    echo ""
    
    read -p "Start work on issue #$issue_number? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Cancelled"
        exit 0
    fi
    
    # Update GitHub board
    log "Updating GitHub project board..."
    if [[ -f "./scripts/gh-board-sync.sh" ]]; then
        ./scripts/gh-board-sync.sh start "$issue_number"
    else
        warn "GitHub board sync script not found, skipping board update..."
    fi
    
    # Start progress tracking
    start_tracking
    
    # Show next steps
    echo ""
    echo -e "${CYAN}🎯 Next Steps:${NC}"
    echo "1. Review issue requirements and acceptance criteria"
    echo "2. Plan your TDD approach (write tests first)"
    echo "3. Use appropriate scripts:"
    echo "   - React hooks: ./scripts/tdd-hooks-commit.sh hook-name \"description\""
    echo "   - Features: ./scripts/tdd-phase-4-commit.sh feature-name \"description\""
    echo "   - Basic changes: ./scripts/safe-commit.sh \"message\""
    echo "4. When complete: ./scripts/gh-board-sync.sh complete $issue_number"
    echo ""
    
    success "Work session started for issue #$issue_number"
    success "Progress is being tracked in PROGRESS.md"
}

# Handle script arguments
case "${1:-}" in
    "help"|"--help"|"-h")
        echo "Enhanced Start Work Script with GitHub Board Integration"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)    Interactive issue selection and work start"
        echo "  help         Show this help"
        echo ""
        echo "This script will:"
        echo "  1. Check current progress and offer to continue"
        echo "  2. Show available GitHub issues"
        echo "  3. Update GitHub project board"
        echo "  4. Start progress tracking"
        echo "  5. Guide you through next steps"
        ;;
    *)
        main "$@"
        ;;
esac