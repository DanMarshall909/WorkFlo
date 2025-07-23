#!/bin/bash

# decompose-issue.sh - Decompose GitHub issues into atomic micro-issues
# Usage: ./scripts/workflow/decompose-issue.sh <issue_number>

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
    echo -e "${BLUE}[DECOMPOSE]${NC} $1"
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
    if ! command -v gh >/dev/null 2>&1; then
        error "GitHub CLI (gh) not found. Install from: https://cli.github.com/"
    fi
    
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI not authenticated. Run 'gh auth login' first."
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        error "jq not found. Install with: sudo apt-get install jq"
    fi
}

# Validate issue number
validate_issue() {
    local issue_number="$1"
    
    if [[ ! "$issue_number" =~ ^[0-9]+$ ]]; then
        error "Invalid issue number: $issue_number"
    fi
    
    # Check if issue exists
    if ! gh issue view "$issue_number" >/dev/null 2>&1; then
        error "Issue #$issue_number not found or not accessible"
    fi
}

# Extract test scenarios from issue description
extract_test_scenarios() {
    local issue_number="$1"
    local issue_content="$2"
    
    log "Analyzing issue #$issue_number for test scenarios..."
    
    # Create temporary file for analysis
    local temp_file="$MICRO_ISSUES_DIR/temp-analysis-$issue_number.md"
    echo "$issue_content" > "$temp_file"
    
    # Extract acceptance criteria section
    local acceptance_criteria
    acceptance_criteria=$(echo "$issue_content" | sed -n '/## 📋 Acceptance Criteria/,/## /p' | head -n -1)
    
    # Extract test specification section  
    local test_specs
    test_specs=$(echo "$issue_content" | sed -n '/## 🧪 Test Specification/,/## /p' | head -n -1)
    
    # Parse acceptance criteria into test scenarios
    local scenarios=()
    
    # Extract bullet points from acceptance criteria
    while IFS= read -r line; do
        if [[ "$line" =~ ^-\ \[\ \]\ (.+)$ ]]; then
            local criteria="${BASH_REMATCH[1]}"
            # Convert acceptance criteria to test scenario name
            local test_name=$(echo "$criteria" | \
                tr '[:upper:]' '[:lower:]' | \
                sed 's/[^a-z0-9 ]//g' | \
                sed 's/ /_/g' | \
                sed 's/__*/_/g' | \
                sed 's/^_//;s/_$//')
            scenarios+=("$test_name:$criteria")
        fi
    done <<< "$acceptance_criteria"
    
    # Also extract explicit test specifications
    while IFS= read -r line; do
        if [[ "$line" =~ ^\-\ \[\ \]\ \*\*Test\ [0-9]+\*\*:\ (.+)$ ]]; then
            local test_desc="${BASH_REMATCH[1]}"
            local test_name=$(echo "$test_desc" | \
                tr '[:upper:]' '[:lower:]' | \
                sed 's/[^a-z0-9 ]//g' | \
                sed 's/ /_/g' | \
                sed 's/__*/_/g' | \
                sed 's/^_//;s/_$//')
            scenarios+=("$test_name:$test_desc")
        fi
    done <<< "$test_specs"
    
    rm -f "$temp_file"
    
    if [[ ${#scenarios[@]} -eq 0 ]]; then
        warn "No explicit test scenarios found in issue. Creating default scenarios..."
        # Create basic scenarios based on issue title
        local title=$(gh issue view "$issue_number" --json title -q '.title')
        local default_name=$(echo "$title" | \
            tr '[:upper:]' '[:lower:]' | \
            sed 's/[^a-z0-9 ]//g' | \
            sed 's/ /_/g')
        scenarios+=("${default_name}_basic_functionality:Basic functionality for $title")
        scenarios+=("${default_name}_error_handling:Error handling for $title")
        scenarios+=("${default_name}_edge_cases:Edge cases for $title")
    fi
    
    printf '%s\n' "${scenarios[@]}"
}

# Create micro-issue structure
create_micro_issue_structure() {
    local issue_number="$1"
    local issue_title="$2"
    local issue_body="$3"
    local scenarios=("${@:4}")
    
    log "Creating micro-issue structure for issue #$issue_number..."
    
    mkdir -p "$MICRO_ISSUES_DIR"
    
    local micro_issue_file="$MICRO_ISSUES_DIR/issue-$issue_number.json"
    
    # Start JSON structure
    cat > "$micro_issue_file" << EOF
{
  "parent_issue": $issue_number,
  "title": $(echo "$issue_title" | jq -R .),
  "description": $(echo "$issue_body" | jq -Rs .),
  "created_at": "$(date -Iseconds)",
  "status": "DECOMPOSED",
  "micro_issues": [
EOF

    # Add infrastructure micro-issue first
    local infra_test_name="setup_test_infrastructure_for_issue_$issue_number"
    cat >> "$micro_issue_file" << EOF
    {
      "id": "$issue_number.0",
      "test_name": "$infra_test_name",
      "description": "Set up test infrastructure and shared utilities for issue #$issue_number",
      "type": "INFRASTRUCTURE",
      "status": "NOT_STARTED",
      "visibility": "VISIBLE",
      "test_file": null,
      "implementation_files": [],
      "tdd_commits": [],
      "created_at": "$(date -Iseconds)"
    }
EOF

    # Add each test scenario as a micro-issue
    local index=1
    for scenario in "${scenarios[@]}"; do
        local test_name="${scenario%%:*}"
        local description="${scenario#*:}"
        
        # Add comma if not first item
        echo "," >> "$micro_issue_file"
        
        cat >> "$micro_issue_file" << EOF
    {
      "id": "$issue_number.$index",
      "test_name": "$test_name",
      "description": $(echo "$description" | jq -R .),
      "type": "BUSINESS_LOGIC",
      "status": "NOT_STARTED",
      "visibility": $([ $index -eq 1 ] && echo '"VISIBLE"' || echo '"HIDDEN"'),
      "test_file": null,
      "implementation_files": [],
      "tdd_commits": [],
      "created_at": "$(date -Iseconds)",
      "depends_on": $([ $index -eq 1 ] && echo "\"$issue_number.0\"" || echo "\"$issue_number.$((index-1))\"")
    }
EOF
        
        ((index++))
    done
    
    # Close JSON structure
    cat >> "$micro_issue_file" << EOF
  ],
  "current_micro_issue": "$issue_number.0",
  "total_micro_issues": $((index)),
  "completed_count": 0
}
EOF
    
    success "Created micro-issue structure: $micro_issue_file"
    echo "$micro_issue_file"
}

# Display decomposition summary
show_decomposition_summary() {
    local micro_issue_file="$1"
    local issue_number="$2"
    
    info "Decomposition Summary for Issue #$issue_number:"
    echo ""
    
    local total_count=$(jq -r '.total_micro_issues' "$micro_issue_file")
    local parent_title=$(jq -r '.title' "$micro_issue_file")
    
    echo -e "${CYAN}📋 Parent Issue:${NC} #$issue_number - $parent_title"
    echo -e "${CYAN}🔬 Total Micro-Issues:${NC} $total_count"
    echo ""
    echo -e "${CYAN}📝 Micro-Issue Breakdown:${NC}"
    
    # Show each micro-issue
    jq -r '.micro_issues[] | "  \(.id): \(.test_name) [\(.type)] - \(.visibility)"' "$micro_issue_file"
    
    echo ""
    echo -e "${GREEN}✅ Next Steps:${NC}"
    echo "  1. Start working: ./scripts/workflow/start-micro-issue.sh $issue_number"
    echo "  2. View progress: ./scripts/workflow/show-micro-progress.sh $issue_number"
    echo "  3. Edit micro-issues: ./scripts/workflow/edit-micro-issues.sh $issue_number"
}

# Main decomposition workflow
main() {
    local issue_number="${1:-}"
    
    if [[ -z "$issue_number" ]]; then
        error "Usage: $0 <issue_number>"
    fi
    
    log "🔬 Starting issue decomposition for #$issue_number"
    
    # Check prerequisites
    check_prereqs
    
    # Validate issue
    validate_issue "$issue_number"
    
    # Check if already decomposed
    local existing_file="$MICRO_ISSUES_DIR/issue-$issue_number.json"
    if [[ -f "$existing_file" ]]; then
        warn "Issue #$issue_number already decomposed: $existing_file"
        read -p "Overwrite existing decomposition? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Using existing decomposition"
            show_decomposition_summary "$existing_file" "$issue_number"
            return 0
        fi
    fi
    
    # Fetch issue details
    log "Fetching issue #$issue_number details..."
    local issue_data
    issue_data=$(gh issue view "$issue_number" --json title,body)
    
    local issue_title
    issue_title=$(echo "$issue_data" | jq -r '.title')
    
    local issue_body
    issue_body=$(echo "$issue_data" | jq -r '.body // ""')
    
    info "Issue: $issue_title"
    
    # Extract test scenarios
    local scenarios
    mapfile -t scenarios < <(extract_test_scenarios "$issue_number" "$issue_body")
    
    info "Found ${#scenarios[@]} test scenarios"
    
    # Create micro-issue structure
    local micro_issue_file
    micro_issue_file=$(create_micro_issue_structure "$issue_number" "$issue_title" "$issue_body" "${scenarios[@]}")
    
    # Show summary
    show_decomposition_summary "$micro_issue_file" "$issue_number"
    
    success "Issue #$issue_number successfully decomposed into ${#scenarios[@]} micro-issues"
}

# Handle help
case "${1:-}" in
    "help"|"--help"|"-h")
        echo "GitHub Issue Decomposition Tool"
        echo ""
        echo "Usage: $0 <issue_number>"
        echo ""
        echo "Decomposes a GitHub issue into atomic micro-issues for TDD workflow."
        echo ""
        echo "Each micro-issue represents one test scenario that can be completed"
        echo "in a single TDD cycle (RED-GREEN-REFACTOR-COVER)."
        echo ""
        echo "Examples:"
        echo "  $0 123        # Decompose issue #123"
        echo "  $0 --help     # Show this help"
        ;;
    *)
        main "$@"
        ;;
esac