#!/bin/bash

# GitHub Project Board Automation Script
# Strict integration between development workflow and GitHub project board

set -euo pipefail

# Configuration
PROJECT_NUMBER="2"
PROJECT_ID="PVT_kwHOAjuTnM4A91Jy"  # Actual project ID for GraphQL queries
STATUS_FIELD_ID="PVTSSF_lAHOAjuTnM4A91JyzgxakYU"
OWNER="DanMarshall909"
REPO="Anchor"

# Status option IDs
TODO_ID="f75ad846"
IN_PROGRESS_ID="47fc9ee4"
DONE_ID="98236657"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[BOARD]${NC} $1"
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

# Get project item ID for an issue
get_item_id() {
    local issue_number=$1
    local result
    
    result=$(gh api graphql --field query="
    query {
        repository(owner: \"$OWNER\", name: \"$REPO\") {
            issue(number: $issue_number) {
                projectItems(first: 10) {
                    nodes {
                        id
                        project {
                            id
                        }
                    }
                }
            }
        }
    }" --jq ".data.repository.issue.projectItems.nodes[] | select(.project.id == \"$PROJECT_ID\") | .id" 2>/dev/null)
    
    echo "$result"
}

# Add issue to project board
add_to_board() {
    local issue_number=$1
    local issue_url="https://github.com/$OWNER/$REPO/issues/$issue_number"
    
    log "Adding issue #$issue_number to project board..."
    
    # Add to project
    gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$issue_url"
    success "Issue #$issue_number added to board"
}

# Update issue status on board
update_status() {
    local issue_number=$1
    local status=$2
    
    log "Updating issue #$issue_number to status: $status"
    
    # Get item ID
    local item_id
    item_id=$(get_item_id "$issue_number")
    
    if [[ -z "$item_id" ]]; then
        warn "Issue #$issue_number not found on board. Adding it first..."
        add_to_board "$issue_number"
        sleep 2  # Wait for item to be added
        item_id=$(get_item_id "$issue_number")
    fi
    
    if [[ -z "$item_id" ]]; then
        error "Failed to get item ID for issue #$issue_number"
    fi
    
    # Determine status option ID
    local option_id
    case "$status" in
        "todo"|"Todo")
            option_id="$TODO_ID"
            ;;
        "in-progress"|"In Progress")
            option_id="$IN_PROGRESS_ID"
            ;;
        "done"|"Done")
            option_id="$DONE_ID"
            ;;
        *)
            error "Invalid status: $status. Use: todo, in-progress, or done"
            ;;
    esac
    
    # Update status
    gh project item-edit --id "$item_id" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$option_id"
    success "Issue #$issue_number moved to '$status'"
}

# Start work on an issue (move to In Progress)
start_issue() {
    local issue_number=$1
    
    log "Starting work on issue #$issue_number"
    update_status "$issue_number" "in-progress"
    
    # Update PROGRESS.md
    echo "Current Issue: #$issue_number - $(gh issue view "$issue_number" --json title --jq '.title')" > PROGRESS.md
    echo "Status: In Progress" >> PROGRESS.md
    echo "Started: $(date)" >> PROGRESS.md
    
    success "Issue #$issue_number is now in progress and tracked in PROGRESS.md"
}

# Complete an issue (move to Done)
complete_issue() {
    local issue_number=$1
    
    log "Completing issue #$issue_number"
    update_status "$issue_number" "done"
    
    # Close the issue
    gh issue close "$issue_number"
    
    # Update PROGRESS.md to suggest next issue
    echo "Last Completed: #$issue_number - $(gh issue view "$issue_number" --json title --jq '.title')" > PROGRESS.md
    echo "Completed: $(date)" >> PROGRESS.md
    echo "" >> PROGRESS.md
    echo "Next Issue Suggestions:" >> PROGRESS.md
    gh issue list --state open --limit 5 --json number,title | jq -r '.[] | "  - #\(.number): \(.title)"' >> PROGRESS.md
    
    success "Issue #$issue_number completed and closed"
}

# List current board status
show_board() {
    log "Current project board status:"
    
    echo ""
    echo "📋 IN PROGRESS:"
    gh api graphql --field query="
    query {
        node(id: \"$PROJECT_ID\") {
            ... on ProjectV2 {
                items(first: 50) {
                    nodes {
                        id
                        fieldValues(first: 10) {
                            nodes {
                                ... on ProjectV2ItemFieldSingleSelectValue {
                                    name
                                    field {
                                        ... on ProjectV2FieldCommon {
                                            name
                                        }
                                    }
                                }
                            }
                        }
                        content {
                            ... on Issue {
                                number
                                title
                                url
                            }
                        }
                    }
                }
            }
        }
    }" --jq '.data.node.items.nodes[] | select(.fieldValues.nodes[] | select(.field.name == "Status" and .name == "In Progress")) | .content | "  - #\(.number): \(.title)"'
    
    echo ""
    echo "📝 TODO:"
    gh api graphql --field query="
    query {
        node(id: \"$PROJECT_ID\") {
            ... on ProjectV2 {
                items(first: 50) {
                    nodes {
                        id
                        fieldValues(first: 10) {
                            nodes {
                                ... on ProjectV2ItemFieldSingleSelectValue {
                                    name
                                    field {
                                        ... on ProjectV2FieldCommon {
                                            name
                                        }
                                    }
                                }
                            }
                        }
                        content {
                            ... on Issue {
                                number
                                title
                                url
                            }
                        }
                    }
                }
            }
        }
    }" --jq '.data.node.items.nodes[] | select(.fieldValues.nodes[] | select(.field.name == "Status" and .name == "Todo")) | .content | "  - #\(.number): \(.title)"' | head -10
}

# Main command dispatcher
case "${1:-}" in
    "add")
        [[ $# -eq 2 ]] || error "Usage: $0 add <issue_number>"
        check_auth
        add_to_board "$2"
        ;;
    "start")
        [[ $# -eq 2 ]] || error "Usage: $0 start <issue_number>"
        check_auth
        start_issue "$2"
        ;;
    "complete")
        [[ $# -eq 2 ]] || error "Usage: $0 complete <issue_number>"
        check_auth
        complete_issue "$2"
        ;;
    "status")
        [[ $# -eq 3 ]] || error "Usage: $0 status <issue_number> <status>"
        check_auth
        update_status "$2" "$3"
        ;;
    "show"|"board")
        check_auth
        show_board
        ;;
    "help"|"--help"|"-h")
        echo "GitHub Project Board Automation"
        echo ""
        echo "Usage: $0 <command> [args...]"
        echo ""
        echo "Commands:"
        echo "  add <issue_number>              Add issue to project board"
        echo "  start <issue_number>            Start work on issue (move to In Progress)"
        echo "  complete <issue_number>         Complete issue (move to Done and close)"
        echo "  status <issue_number> <status>  Update issue status (todo/in-progress/done)"
        echo "  show                            Show current board status"
        echo "  help                            Show this help"
        echo ""
        echo "Examples:"
        echo "  $0 start 73                     # Start working on issue #73"
        echo "  $0 complete 65                  # Complete and close issue #65"
        echo "  $0 show                         # View current board status"
        ;;
    *)
        error "Unknown command: ${1:-}. Use '$0 help' for usage information."
        ;;
esac