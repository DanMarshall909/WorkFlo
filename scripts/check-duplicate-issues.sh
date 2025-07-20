#!/bin/bash

# check-duplicate-issues.sh - Prevent duplicate issue creation
# Usage: ./scripts/check-duplicate-issues.sh "<title>" "<keywords>" [--json]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SIMILARITY_THRESHOLD=0.7  # 70% similarity threshold
MAX_RESULTS=10

log() {
    echo -e "${BLUE}[DUPLICATE-CHECK]${NC} $1" >&2
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

# Check if gh CLI is authenticated
check_auth() {
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI not authenticated. Run 'gh auth login' first."
    fi
}

# Calculate similarity between two strings (simple approach)
calculate_similarity() {
    local str1="$1"
    local str2="$2"
    
    # Convert to lowercase for comparison
    str1=$(echo "$str1" | tr '[:upper:]' '[:lower:]')
    str2=$(echo "$str2" | tr '[:upper:]' '[:lower:]')
    
    # Count common words
    local words1=($(echo "$str1" | tr -s '[:space:]' '\n'))
    local words2=($(echo "$str2" | tr -s '[:space:]' '\n'))
    local common_words=0
    local total_words=${#words1[@]}
    
    for word1 in "${words1[@]}"; do
        for word2 in "${words2[@]}"; do
            if [[ "$word1" == "$word2" && ${#word1} -gt 2 ]]; then
                ((common_words++))
                break
            fi
        done
    done
    
    # Calculate similarity ratio
    if [[ $total_words -eq 0 ]]; then
        echo "0"
    else
        echo "scale=2; $common_words / $total_words" | bc -l
    fi
}

# Search for similar issues by keywords
search_by_keywords() {
    local keywords="$1"
    local results=()
    
    # Split keywords by comma
    IFS=',' read -ra keyword_array <<< "$keywords"
    
    for keyword in "${keyword_array[@]}"; do
        keyword=$(echo "$keyword" | xargs)  # Trim whitespace
        if [[ -n "$keyword" ]]; then
            # Search in title and body
            local search_results
            search_results=$(gh issue list --state all --search "$keyword" --json number,title,labels,state --limit $MAX_RESULTS 2>/dev/null || echo "[]")
            
            # Merge results
            if [[ "$search_results" != "[]" ]]; then
                results+=("$search_results")
            fi
        fi
    done
    
    # Combine and deduplicate results
    if [[ ${#results[@]} -gt 0 ]]; then
        printf '%s\n' "${results[@]}" | jq -s 'map(.[]) | unique_by(.number)'
    else
        echo "[]"
    fi
}

# Search for title similarity
search_by_title() {
    local title="$1"
    local all_issues
    
    # Get all open issues
    all_issues=$(gh issue list --state all --json number,title,labels,state --limit 100 2>/dev/null || echo "[]")
    
    echo "$all_issues"
}

# Main duplicate checking logic
check_duplicates() {
    local title="$1"
    local keywords="$2"
    local output_json="${3:-false}"
    
    log "Checking for duplicate issues..."
    log "Title: $title"
    log "Keywords: $keywords"
    
    # Search by keywords
    local keyword_results
    keyword_results=$(search_by_keywords "$keywords")
    
    # Search by title similarity
    local title_results
    title_results=$(search_by_title "$title")
    
    # Combine and analyze results
    local combined_results
    combined_results=$(echo "$keyword_results $title_results" | jq -s 'map(.[]) | flatten | unique_by(.number)')
    
    # Filter for similarity
    local similar_issues=()
    
    while IFS= read -r issue; do
        if [[ -n "$issue" && "$issue" != "null" ]]; then
            local issue_title
            issue_title=$(echo "$issue" | jq -r '.title')
            local issue_number
            issue_number=$(echo "$issue" | jq -r '.number')
            local issue_state
            issue_state=$(echo "$issue" | jq -r '.state')
            
            # Calculate title similarity
            local similarity
            similarity=$(calculate_similarity "$title" "$issue_title")
            
            # Check if similarity is above threshold
            if (( $(echo "$similarity >= $SIMILARITY_THRESHOLD" | bc -l) )); then
                similar_issues+=("$issue")
                log "Found similar issue #$issue_number (${similarity}% match): $issue_title [$issue_state]"
            fi
        fi
    done < <(echo "$combined_results" | jq -c '.[]')
    
    # Output results
    if [[ ${#similar_issues[@]} -eq 0 ]]; then
        if [[ "$output_json" == "true" ]]; then
            echo '{"duplicates_found": false, "similar_issues": []}'
        else
            echo "NO_DUPLICATES_FOUND"
        fi
        success "No duplicate issues found"
        exit 0
    else
        if [[ "$output_json" == "true" ]]; then
            printf '{"duplicates_found": true, "similar_issues": [%s]}' "$(IFS=,; echo "${similar_issues[*]}")"
        else
            for issue in "${similar_issues[@]}"; do
                local issue_number
                issue_number=$(echo "$issue" | jq -r '.number')
                local issue_title
                issue_title=$(echo "$issue" | jq -r '.title')
                local issue_state
                issue_state=$(echo "$issue" | jq -r '.state')
                echo "DUPLICATE_FOUND:#$issue_number:$issue_title:$issue_state"
            done
        fi
        warn "Found ${#similar_issues[@]} similar issue(s)"
        exit 1
    fi
}

# Show help
show_help() {
    echo "Duplicate Issue Checker"
    echo ""
    echo "Usage: $0 \"<title>\" \"<keywords>\" [--json]"
    echo ""
    echo "Arguments:"
    echo "  title      The proposed issue title"
    echo "  keywords   Comma-separated keywords to search for"
    echo "  --json     Output results in JSON format"
    echo ""
    echo "Examples:"
    echo "  $0 \"Fix hardcoded database connections\" \"technical-debt,database,connection\""
    echo "  $0 \"Add user authentication\" \"auth,login,security\" --json"
    echo ""
    echo "Exit codes:"
    echo "  0 - No duplicates found"
    echo "  1 - Similar issues found"
    echo "  2 - Error in execution"
}

# Main execution
if [[ $# -lt 2 ]]; then
    show_help
    exit 2
fi

# Check dependencies
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) is required but not installed"
fi

if ! command -v jq &> /dev/null; then
    error "jq is required but not installed"
fi

if ! command -v bc &> /dev/null; then
    error "bc is required but not installed"
fi

# Parse arguments
TITLE="$1"
KEYWORDS="$2"
OUTPUT_JSON="false"

if [[ $# -ge 3 && "$3" == "--json" ]]; then
    OUTPUT_JSON="true"
fi

# Validate inputs
if [[ -z "$TITLE" ]]; then
    error "Title cannot be empty"
fi

if [[ -z "$KEYWORDS" ]]; then
    error "Keywords cannot be empty"
fi

# Check authentication and run
check_auth
check_duplicates "$TITLE" "$KEYWORDS" "$OUTPUT_JSON"