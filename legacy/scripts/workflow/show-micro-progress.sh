#!/bin/bash

# show-micro-progress.sh - Display micro-issue progress with visual indicators
# Usage: ./scripts/workflow/show-micro-progress.sh <issue_number>

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MICRO_ISSUES_DIR="$PROJECT_ROOT/.workflo/micro-issues"

log() {
    echo -e "${BLUE}[PROGRESS]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
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

# Get status icon for micro-issue
get_status_icon() {
    local status="$1"
    local visibility="$2"
    
    case "$status" in
        "COMPLETED")
            echo "✅"
            ;;
        "IN_PROGRESS")
            echo "🔄"
            ;;
        "NOT_STARTED")
            if [[ "$visibility" == "VISIBLE" ]]; then
                echo "📋"
            else
                echo "🔒"
            fi
            ;;
        *)
            echo "❓"
            ;;
    esac
}

# Get phase progress indicator
get_phase_progress() {
    local commits="$1"
    
    if [[ "$commits" == "[]" || "$commits" == "null" ]]; then
        echo "⚪⚪⚪⚪"
        return
    fi
    
    local red_done=false
    local green_done=false
    local refactor_done=false
    local cover_done=false
    
    # Parse commits to see which phases are done
    if echo "$commits" | grep -q "RED:"; then
        red_done=true
    fi
    if echo "$commits" | grep -q "GREEN:"; then
        green_done=true
    fi
    if echo "$commits" | grep -q "REFACTOR:"; then
        refactor_done=true
    fi
    if echo "$commits" | grep -q "COVER:"; then
        cover_done=true
    fi
    
    local progress=""
    progress+=$([ "$red_done" = true ] && echo "🔴" || echo "⚪")
    progress+=$([ "$green_done" = true ] && echo "🟢" || echo "⚪")
    progress+=$([ "$refactor_done" = true ] && echo "🔵" || echo "⚪")
    progress+=$([ "$cover_done" = true ] && echo "📊" || echo "⚪")
    
    echo "$progress"
}

# Show overall progress summary
show_progress_summary() {
    local micro_issue_file="$1"
    local issue_number="$2"
    
    local parent_title
    parent_title=$(jq -r '.title' "$micro_issue_file")
    
    local total_count
    total_count=$(jq -r '.total_micro_issues' "$micro_issue_file")
    
    local completed_count
    completed_count=$(jq -r '.completed_count' "$micro_issue_file")
    
    local current_micro_issue
    current_micro_issue=$(jq -r '.current_micro_issue // "None"' "$micro_issue_file")
    
    echo ""
    echo -e "${CYAN}📊 Progress Summary${NC}"
    echo -e "${CYAN}==================${NC}"
    echo ""
    echo -e "${BLUE}Issue:${NC} #$issue_number - $parent_title"
    echo -e "${BLUE}Progress:${NC} $completed_count/$total_count micro-issues completed"
    echo -e "${BLUE}Current:${NC} $current_micro_issue"
    
    # Progress bar
    local progress_percent=$((completed_count * 100 / total_count))
    local bar_length=20
    local filled_length=$((completed_count * bar_length / total_count))
    
    echo -ne "${BLUE}Progress Bar:${NC} ["
    for ((i=0; i<filled_length; i++)); do
        echo -ne "${GREEN}█${NC}"
    done
    for ((i=filled_length; i<bar_length; i++)); do
        echo -ne "${GRAY}░${NC}"
    done
    echo -e "] ${progress_percent}%"
}

# Show detailed micro-issue list
show_micro_issue_details() {
    local micro_issue_file="$1"
    
    echo ""
    echo -e "${CYAN}🔬 Micro-Issue Details${NC}"
    echo -e "${CYAN}=====================${NC}"
    echo ""
    
    # Table header
    printf "%-8s %-8s %-4s %-50s %-12s\n" "ID" "Status" "TDD" "Test Name" "Type"
    printf "%-8s %-8s %-4s %-50s %-12s\n" "----" "------" "---" "---------" "----"
    
    # Process each micro-issue
    jq -r '.micro_issues[] | @json' "$micro_issue_file" | while IFS= read -r micro_issue; do
        local id
        id=$(echo "$micro_issue" | jq -r '.id')
        
        local status
        status=$(echo "$micro_issue" | jq -r '.status')
        
        local visibility
        visibility=$(echo "$micro_issue" | jq -r '.visibility')
        
        local test_name
        test_name=$(echo "$micro_issue" | jq -r '.test_name')
        
        local type
        type=$(echo "$micro_issue" | jq -r '.type')
        
        local commits
        commits=$(echo "$micro_issue" | jq -r '.tdd_commits')
        
        # Truncate long test names
        if [[ ${#test_name} -gt 47 ]]; then
            test_name="${test_name:0:44}..."
        fi
        
        local status_icon
        status_icon=$(get_status_icon "$status" "$visibility")
        
        local phase_progress
        phase_progress=$(get_phase_progress "$commits")
        
        # Color coding for rows
        local color=""
        case "$status" in
            "COMPLETED")
                color="${GREEN}"
                ;;
            "IN_PROGRESS")
                color="${YELLOW}"
                ;;
            "NOT_STARTED")
                if [[ "$visibility" == "VISIBLE" ]]; then
                    color="${CYAN}"
                else
                    color="${GRAY}"
                fi
                ;;
        esac
        
        printf "${color}%-8s${NC} %-8s %-4s %-50s %-12s\n" \
            "$id" "$status_icon" "$phase_progress" "$test_name" "$type"
    done
}

# Show next steps
show_next_steps() {
    local micro_issue_file="$1"
    local issue_number="$2"
    
    local current_id
    current_id=$(jq -r '.micro_issues[] | select(.status != "COMPLETED" and .visibility == "VISIBLE") | .id' "$micro_issue_file" | head -1)
    
    echo ""
    echo -e "${GREEN}🎯 Next Steps${NC}"
    echo -e "${GREEN}==============${NC}"
    echo ""
    
    if [[ -n "$current_id" && "$current_id" != "null" ]]; then
        local current_test_name
        current_test_name=$(jq -r --arg id "$current_id" '.micro_issues[] | select(.id == $id) | .test_name' "$micro_issue_file")
        
        local current_phase
        current_phase=$(jq -r --arg id "$current_id" '.micro_issues[] | select(.id == $id) | .current_phase // "NONE"' "$micro_issue_file")
        
        echo -e "${BLUE}Current Micro-Issue:${NC} $current_id"
        echo -e "${BLUE}Test Name:${NC} $current_test_name"
        
        case "$current_phase" in
            "NONE")
                echo -e "${BLUE}Next Action:${NC} Start RED phase"
                echo -e "${BLUE}Command:${NC} ./scripts/tdd/tdd-micro-cycle.sh RED"
                ;;
            "RED")
                echo -e "${BLUE}Next Action:${NC} Continue to GREEN phase"
                echo -e "${BLUE}Command:${NC} ./scripts/tdd/tdd-micro-cycle.sh GREEN"
                ;;
            "GREEN")
                echo -e "${BLUE}Next Action:${NC} Continue to REFACTOR phase"
                echo -e "${BLUE}Command:${NC} ./scripts/tdd/tdd-micro-cycle.sh REFACTOR"
                ;;
            "REFACTOR")
                echo -e "${BLUE}Next Action:${NC} Complete with COVER phase"
                echo -e "${BLUE}Command:${NC} ./scripts/tdd/tdd-micro-cycle.sh COVER"
                ;;
            *)
                echo -e "${BLUE}Next Action:${NC} Resume micro-issue work"
                echo -e "${BLUE}Command:${NC} ./scripts/workflow/start-micro-issue.sh $issue_number"
                ;;
        esac
    else
        # Check if all completed
        local total_count
        total_count=$(jq -r '.total_micro_issues' "$micro_issue_file")
        
        local completed_count
        completed_count=$(jq -r '.completed_count' "$micro_issue_file")
        
        if [[ "$completed_count" -eq "$total_count" ]]; then
            echo -e "${GREEN}🎉 All micro-issues completed!${NC}"
            echo ""
            echo -e "${BLUE}Next Actions:${NC}"
            echo "  1. Review all changes: git log --oneline"
            echo "  2. Run quality check: ./scripts/quality/pr-quality-check.sh"
            echo "  3. Create PR: gh pr create --base master"
        else
            echo -e "${YELLOW}⚠️  No visible micro-issues available${NC}"
            echo ""
            echo -e "${BLUE}Possible Actions:${NC}"
            echo "  1. Start micro-issue work: ./scripts/workflow/start-micro-issue.sh $issue_number"
            echo "  2. Check for issues: Look for dependencies or blocking problems"
        fi
    fi
}

# Main progress display
main() {
    local issue_number="${1:-}"
    
    if [[ -z "$issue_number" ]]; then
        error "Usage: $0 <issue_number>"
    fi
    
    log "📊 Showing micro-issue progress for issue #$issue_number"
    
    # Load micro-issue data
    local micro_issue_file
    micro_issue_file=$(load_micro_issue_data "$issue_number")
    
    # Show progress summary
    show_progress_summary "$micro_issue_file" "$issue_number"
    
    # Show detailed micro-issue list
    show_micro_issue_details "$micro_issue_file"
    
    # Show next steps
    show_next_steps "$micro_issue_file" "$issue_number"
    
    echo ""
}

# Handle help
case "${1:-}" in
    "help"|"--help"|"-h")
        echo "Micro-Issue Progress Display"
        echo ""
        echo "Usage: $0 <issue_number>"
        echo ""
        echo "Shows detailed progress for all micro-issues in the specified GitHub issue."
        echo ""
        echo "Legend:"
        echo "  ✅ Completed micro-issue"
        echo "  🔄 In progress micro-issue"
        echo "  📋 Available to start"
        echo "  🔒 Hidden (progressive disclosure)"
        echo ""
        echo "TDD Phase Indicators:"
        echo "  🔴 RED phase (failing test)"
        echo "  🟢 GREEN phase (minimal implementation)"
        echo "  🔵 REFACTOR phase (code improvement)"
        echo "  📊 COVER phase (comprehensive testing)"
        echo "  ⚪ Phase not completed"
        ;;
    *)
        main "$@"
        ;;
esac