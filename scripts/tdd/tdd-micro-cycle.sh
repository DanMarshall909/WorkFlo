#!/bin/bash

# tdd-micro-cycle.sh - TDD cycle for micro-issues with progressive disclosure
# Usage: ./scripts/tdd/tdd-micro-cycle.sh <RED|GREEN|REFACTOR|COVER>

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MICRO_ISSUES_DIR="$PROJECT_ROOT/.workflo/micro-issues"

log() {
    echo -e "${BLUE}[TDD-MICRO]${NC} $1"
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

debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
    fi
}

# Load current session
load_current_session() {
    local session_file="$PROJECT_ROOT/.workflo/current-session.json"
    
    if [[ ! -f "$session_file" ]]; then
        error "No active micro-issue session. Run: ./scripts/workflow/start-micro-issue.sh <issue_number>"
    fi
    
    echo "$session_file"
}

# Get session details
get_session_data() {
    local session_file="$1"
    local field="$2"
    
    jq -r ".$field" "$session_file"
}

# Update micro-issue state
update_micro_issue_state() {
    local issue_number="$1"
    local micro_issue_id="$2"
    local phase="$3"
    local commit_hash="$4"
    
    local micro_issue_file="$MICRO_ISSUES_DIR/issue-$issue_number.json"
    
    # Update the specific micro-issue with phase completion
    local temp_file=$(mktemp)
    jq --arg id "$micro_issue_id" \
       --arg phase "$phase" \
       --arg commit "$commit_hash" \
       --arg timestamp "$(date -Iseconds)" \
       '.micro_issues = (.micro_issues | map(
         if .id == $id then
           .tdd_commits += [($phase + ": " + $commit)] |
           .current_phase = $phase |
           .last_updated = $timestamp
         else . end
       ))' "$micro_issue_file" > "$temp_file"
    
    mv "$temp_file" "$micro_issue_file"
    
    debug "Updated micro-issue $micro_issue_id with $phase phase completion"
}

# Mark micro-issue as completed and reveal next
complete_micro_issue() {
    local issue_number="$1"
    local micro_issue_id="$2"
    
    local micro_issue_file="$MICRO_ISSUES_DIR/issue-$issue_number.json"
    
    # Mark current micro-issue as completed
    local temp_file=$(mktemp)
    jq --arg id "$micro_issue_id" \
       --arg timestamp "$(date -Iseconds)" \
       '.micro_issues = (.micro_issues | map(
         if .id == $id then
           .status = "COMPLETED" |
           .completed_at = $timestamp
         else . end
       )) |
       .completed_count = (.micro_issues | map(select(.status == "COMPLETED")) | length)' \
       "$micro_issue_file" > "$temp_file"
    
    mv "$temp_file" "$micro_issue_file"
    
    # Reveal next micro-issue (make it visible)
    reveal_next_micro_issue "$issue_number" "$micro_issue_id"
    
    success "Micro-issue $micro_issue_id completed!"
}

# Reveal the next micro-issue in sequence
reveal_next_micro_issue() {
    local issue_number="$1"
    local completed_id="$2"
    
    local micro_issue_file="$MICRO_ISSUES_DIR/issue-$issue_number.json"
    
    # Find the next micro-issue that depends on the completed one
    local next_id
    next_id=$(jq -r --arg completed "$completed_id" \
        '.micro_issues[] | select(.depends_on == $completed and .status == "NOT_STARTED") | .id' \
        "$micro_issue_file" | head -1)
    
    if [[ -n "$next_id" && "$next_id" != "null" ]]; then
        # Make next micro-issue visible
        local temp_file=$(mktemp)
        jq --arg id "$next_id" \
           '.micro_issues = (.micro_issues | map(
             if .id == $id then
               .visibility = "VISIBLE"
             else . end
           )) |
           .current_micro_issue = $id' \
           "$micro_issue_file" > "$temp_file"
        
        mv "$temp_file" "$micro_issue_file"
        
        info "Next micro-issue revealed: $next_id"
    else
        info "No more micro-issues to reveal - issue may be complete!"
    fi
}

# Validate phase transition
validate_phase_transition() {
    local current_phase="$1"
    local session_file="$2"
    
    local issue_number
    issue_number=$(get_session_data "$session_file" "issue_number")
    
    local micro_issue_id
    micro_issue_id=$(get_session_data "$session_file" "micro_issue_id")
    
    local micro_issue_file="$MICRO_ISSUES_DIR/issue-$issue_number.json"
    
    # Get current micro-issue state
    local last_phase
    last_phase=$(jq -r --arg id "$micro_issue_id" \
        '.micro_issues[] | select(.id == $id) | .current_phase // "NONE"' \
        "$micro_issue_file")
    
    # Define valid phase transitions
    case "$last_phase" in
        "NONE")
            [[ "$current_phase" == "RED" ]] || error "Must start with RED phase"
            ;;
        "RED")
            [[ "$current_phase" == "GREEN" ]] || error "After RED, must proceed to GREEN phase"
            ;;
        "GREEN")
            [[ "$current_phase" == "REFACTOR" ]] || error "After GREEN, must proceed to REFACTOR phase"
            ;;
        "REFACTOR")
            [[ "$current_phase" == "COVER" ]] || error "After REFACTOR, must proceed to COVER phase"
            ;;
        "COVER")
            error "Micro-issue already completed. Start next micro-issue."
            ;;
        *)
            warn "Unknown last phase: $last_phase. Allowing $current_phase."
            ;;
    esac
}

# Execute RED phase
execute_red_phase() {
    local session_file="$1"
    
    log "🔴 RED Phase - Write failing test"
    
    local test_name
    test_name=$(get_session_data "$session_file" "test_name")
    
    local description
    description=$(get_session_data "$session_file" "description")
    
    echo ""
    echo -e "${RED}🎯 Focus: Write ONE failing test${NC}"
    echo -e "${BLUE}Test Name:${NC} $test_name"
    echo -e "${BLUE}Scenario:${NC} $description"
    echo ""
    echo -e "${YELLOW}Requirements:${NC}"
    echo "  ✅ Test must be named: $test_name"
    echo "  ✅ Test must FAIL when run"
    echo "  ✅ Test must cover ONLY the current scenario"
    echo "  ✅ No implementation code - test only!"
    echo ""
    
    # Wait for user to write test
    read -p "Press Enter when you have written the failing test..."
    
    # Verify test exists and fails
    log "Verifying test exists and fails..."
    
    # Run tests to ensure they fail
    if dotnet test --no-build --verbosity quiet 2>/dev/null; then
        error "❌ Tests are passing! RED phase requires failing tests"
    else
        success "✅ Tests failing as expected"
    fi
    
    # Commit the failing test
    local issue_number
    issue_number=$(get_session_data "$session_file" "issue_number")
    
    local micro_issue_id
    micro_issue_id=$(get_session_data "$session_file" "micro_issue_id")
    
    local commit_message="RED $micro_issue_id: $test_name - failing test"
    
    git add .
    git commit -m "$commit_message"
    
    local commit_hash
    commit_hash=$(git rev-parse HEAD)
    
    # Update micro-issue state
    update_micro_issue_state "$issue_number" "$micro_issue_id" "RED" "$commit_hash"
    
    success "RED phase completed. Next: ./scripts/tdd/tdd-micro-cycle.sh GREEN"
}

# Execute GREEN phase
execute_green_phase() {
    local session_file="$1"
    
    log "🟢 GREEN Phase - Make test pass with minimal implementation"
    
    local test_name
    test_name=$(get_session_data "$session_file" "test_name")
    
    echo ""
    echo -e "${GREEN}🎯 Focus: Minimal implementation to pass test${NC}"
    echo -e "${BLUE}Test Name:${NC} $test_name"
    echo ""
    echo -e "${YELLOW}Requirements:${NC}"
    echo "  ✅ Implement ONLY what's needed to pass the test"
    echo "  ✅ No extra features or 'nice to haves'"
    echo "  ✅ Simplest possible solution"
    echo "  ✅ Test must pass after implementation"
    echo ""
    
    # Wait for user to implement
    read -p "Press Enter when you have implemented the minimal solution..."
    
    # Verify tests pass
    log "Verifying tests pass..."
    
    if ! dotnet test --no-build --verbosity quiet; then
        error "❌ Tests are still failing! GREEN phase requires passing tests"
    else
        success "✅ Tests passing as expected"
    fi
    
    # Commit the implementation
    local issue_number
    issue_number=$(get_session_data "$session_file" "issue_number")
    
    local micro_issue_id
    micro_issue_id=$(get_session_data "$session_file" "micro_issue_id")
    
    local commit_message="GREEN $micro_issue_id: $test_name - minimal implementation"
    
    git add .
    git commit -m "$commit_message"
    
    local commit_hash
    commit_hash=$(git rev-parse HEAD)
    
    # Update micro-issue state
    update_micro_issue_state "$issue_number" "$micro_issue_id" "GREEN" "$commit_hash"
    
    success "GREEN phase completed. Next: ./scripts/tdd/tdd-micro-cycle.sh REFACTOR"
}

# Execute REFACTOR phase
execute_refactor_phase() {
    local session_file="$1"
    
    log "🔵 REFACTOR Phase - Improve code while keeping tests green"
    
    local test_name
    test_name=$(get_session_data "$session_file" "test_name")
    
    echo ""
    echo -e "${BLUE}🎯 Focus: Improve code quality${NC}"
    echo -e "${BLUE}Test Name:${NC} $test_name"
    echo ""
    echo -e "${YELLOW}Requirements:${NC}"
    echo "  ✅ Improve code structure, readability, performance"
    echo "  ✅ Remove duplication"
    echo "  ✅ Apply design patterns where appropriate"
    echo "  ✅ ALL tests must remain passing"
    echo "  ✅ Can refactor code from previous micro-issues too"
    echo ""
    
    # Wait for user to refactor
    read -p "Press Enter when you have refactored the code (or skip if no refactoring needed)..."
    
    # Check if any changes were made
    if git diff --quiet; then
        info "No changes detected - skipping refactor commit"
    else
        # Verify tests still pass after refactoring
        log "Verifying tests still pass after refactoring..."
        
        if ! dotnet test --no-build --verbosity quiet; then
            error "❌ Tests failing after refactor! Refactoring broke something"
        else
            success "✅ Tests still passing after refactor"
        fi
        
        # Commit the refactoring
        local issue_number
        issue_number=$(get_session_data "$session_file" "issue_number")
        
        local micro_issue_id
        micro_issue_id=$(get_session_data "$session_file" "micro_issue_id")
        
        local commit_message="REFACTOR $micro_issue_id: $test_name - improve code quality"
        
        git add .
        git commit -m "$commit_message"
        
        local commit_hash
        commit_hash=$(git rev-parse HEAD)
        
        # Update micro-issue state
        update_micro_issue_state "$issue_number" "$micro_issue_id" "REFACTOR" "$commit_hash"
    fi
    
    success "REFACTOR phase completed. Next: ./scripts/tdd/tdd-micro-cycle.sh COVER"
}

# Execute COVER phase
execute_cover_phase() {
    local session_file="$1"
    
    log "📊 COVER Phase - Add comprehensive test coverage"
    
    local test_name
    test_name=$(get_session_data "$session_file" "test_name")
    
    echo ""
    echo -e "${CYAN}🎯 Focus: Comprehensive test coverage${NC}"
    echo -e "${BLUE}Test Name:${NC} $test_name"
    echo ""
    echo -e "${YELLOW}Requirements:${NC}"
    echo "  ✅ Add edge case tests"
    echo "  ✅ Add error condition tests"
    echo "  ✅ Add boundary value tests"
    echo "  ✅ Achieve 95%+ branch coverage"
    echo "  ✅ Focus on current micro-issue functionality"
    echo ""
    
    # Wait for user to add coverage
    read -p "Press Enter when you have added comprehensive test coverage..."
    
    # Run coverage analysis
    log "Running coverage analysis..."
    
    dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage/current --verbosity quiet
    
    # Check coverage (simplified check)
    local coverage_files
    coverage_files=$(find ./coverage/current -name "coverage.cobertura.xml" 2>/dev/null || echo "")
    
    if [[ -n "$coverage_files" ]]; then
        local line_coverage
        line_coverage=$(grep -o 'line-rate="[0-9.]*"' $coverage_files | head -1 | sed 's/line-rate="//;s/"//')
        
        if [[ -n "$line_coverage" ]]; then
            local coverage_percent
            coverage_percent=$(echo "$line_coverage * 100" | bc -l 2>/dev/null || echo "0")
            coverage_percent=${coverage_percent%.*}
            
            if [[ "$coverage_percent" -lt 95 ]]; then
                warn "Coverage is ${coverage_percent}% - below 95% target, but proceeding"
            else
                success "Coverage target met: ${coverage_percent}%"
            fi
        fi
    else
        warn "Coverage analysis not available - proceeding without validation"
    fi
    
    # Commit the additional coverage
    local issue_number
    issue_number=$(get_session_data "$session_file" "issue_number")
    
    local micro_issue_id
    micro_issue_id=$(get_session_data "$session_file" "micro_issue_id")
    
    local commit_message="COVER $micro_issue_id: $test_name - comprehensive test coverage"
    
    git add .
    git commit -m "$commit_message"
    
    local commit_hash
    commit_hash=$(git rev-parse HEAD)
    
    # Update micro-issue state
    update_micro_issue_state "$issue_number" "$micro_issue_id" "COVER" "$commit_hash"
    
    # Mark micro-issue as completed and reveal next
    complete_micro_issue "$issue_number" "$micro_issue_id"
    
    success "COVER phase completed. Micro-issue $micro_issue_id is done!"
    
    # Show next steps
    echo ""
    echo -e "${GREEN}🎉 Micro-Issue Completed!${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "  1. Continue to next micro-issue: ./scripts/workflow/start-micro-issue.sh $issue_number"
    echo "  2. View progress: ./scripts/workflow/show-micro-progress.sh $issue_number"
    echo "  3. Take a break - progress is saved"
}

# Main TDD cycle execution
main() {
    local phase="${1:-}"
    
    if [[ -z "$phase" ]]; then
        error "Usage: $0 <RED|GREEN|REFACTOR|COVER>"
    fi
    
    # Validate phase parameter
    case "$phase" in
        "RED"|"GREEN"|"REFACTOR"|"COVER")
            ;;
        *)
            error "Invalid phase: $phase. Must be one of: RED, GREEN, REFACTOR, COVER"
            ;;
    esac
    
    log "🔄 Starting TDD $phase phase for micro-issue"
    
    # Load current session
    local session_file
    session_file=$(load_current_session)
    
    # Validate phase transition
    validate_phase_transition "$phase" "$session_file"
    
    # Execute the appropriate phase
    case "$phase" in
        "RED")
            execute_red_phase "$session_file"
            ;;
        "GREEN")
            execute_green_phase "$session_file"
            ;;
        "REFACTOR")
            execute_refactor_phase "$session_file"
            ;;
        "COVER")
            execute_cover_phase "$session_file"
            ;;
    esac
}

# Handle help
case "${1:-}" in
    "help"|"--help"|"-h")
        echo "TDD Micro-Cycle for Progressive Disclosure Workflow"
        echo ""
        echo "Usage: $0 <RED|GREEN|REFACTOR|COVER>"
        echo ""
        echo "Phases:"
        echo "  RED       Write failing test for current micro-issue"
        echo "  GREEN     Implement minimal code to pass test"
        echo "  REFACTOR  Improve code while keeping tests green"
        echo "  COVER     Add comprehensive test coverage"
        echo ""
        echo "Must be run in sequence: RED → GREEN → REFACTOR → COVER"
        echo ""
        echo "Prerequisites:"
        echo "  1. Active micro-issue session: ./scripts/workflow/start-micro-issue.sh <issue>"
        echo "  2. Clean git working directory"
        echo "  3. Feature branch for the issue"
        ;;
    *)
        main "$@"
        ;;
esac