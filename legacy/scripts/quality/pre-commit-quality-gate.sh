#!/bin/bash

# Pre-commit Quality Gate Hook
# Ensures local quality checks (ReSharper, tests, formatting) have been run before commit
# This enforces quality standards at the local development level

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$PROJECT_ROOT/reports"

# ANSI color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

call_pre_commit_api() {
    print_info "Calling pre-commit validation API..."

    # Ensure API is running
    "$SCRIPT_DIR/start-api-if-needed.sh"

    # Get staged files
    local staged_files_json
    staged_files_json=$(git diff --cached --name-only --diff-filter=ACM | jq -R . | jq -s .)

    # Construct JSON payload
    local payload
    payload=$(jq -n --argjson files "$staged_files_json" '{"stagedFiles": $files}')

    # Make API call
    local api_response
    api_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        http://localhost:5000/api/validation/pre-commit)

    # Parse API response
    local is_valid
    is_valid=$(echo "$api_response" | jq -r '.isValid')
    local errors
    errors=$(echo "$api_response" | jq -r '.errors[]')

    if [[ "$is_valid" == "true" ]]; then
        print_success "Pre-commit validation passed!"
    else
        print_error "Pre-commit validation failed!"
        echo -e "${RED}Errors:${NC}"
        echo "$errors" | while IFS= read -r line; do
            echo -e "${RED}- $line${NC}"
        done
        exit 1
    fi
}

print_header() {
    echo -e "${BLUE}🔒 Pre-Commit Quality Gate${NC}"
    echo -e "${BLUE}============================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_required_tools() {
    print_info "Checking required tools..."
    
    # Check if quality check script exists
    if [[ ! -f "$SCRIPT_DIR/pr-quality-check.sh" ]]; then
        print_error "Quality check script not found: $SCRIPT_DIR/pr-quality-check.sh"
        exit 1
    fi
    
    # Check if ReSharper CLI is available
    if ! command -v jb &> /dev/null; then
        print_error "ReSharper Command Line Tools (jb) not found"
        print_info "Install with: dotnet tool install -g JetBrains.ReSharper.GlobalTools"
        exit 1
    fi
    
    print_success "Required tools available"
}

check_reports_freshness() {
    print_info "Checking if quality reports are fresh..."
    
    local reports_required=(
        "$REPORTS_DIR/pr-quality-report.html"
        "$REPORTS_DIR/resharper-report.xml"
    )
    
    # Get timestamp of most recent code change (excluding reports directory)
    local latest_code_change
    latest_code_change=$(find "$PROJECT_ROOT" -name "*.cs" -o -name "*.csproj" -o -name "*.sln" | \
        grep -v "/reports/" | \
        xargs stat -c %Y 2>/dev/null | \
        sort -nr | \
        head -1)
    
    if [[ -z "$latest_code_change" ]]; then
        print_warning "Could not determine latest code change timestamp"
        return 0
    fi
    
    local reports_outdated=false
    
    for report in "${reports_required[@]}"; do
        if [[ ! -f "$report" ]]; then
            print_warning "Quality report missing: $(basename "$report")"
            reports_outdated=true
        else
            local report_timestamp
            report_timestamp=$(stat -c %Y "$report" 2>/dev/null || echo "0")
            
            if [[ "$report_timestamp" -lt "$latest_code_change" ]]; then
                print_warning "Quality report outdated: $(basename "$report")"
                reports_outdated=true
            fi
        fi
    done
    
    if [[ "$reports_outdated" == "true" ]]; then
        print_error "Quality reports are missing or outdated"
        print_info "Run the quality check script to generate fresh reports:"
        print_info "  ./scripts/pr-quality-check.sh"
        return 1
    fi
    
    print_success "Quality reports are fresh"
    return 0
}

check_resharper_analysis() {
    print_info "Checking ReSharper and SonarAnalyzer results..."
    
    local resharper_report="$REPORTS_DIR/resharper-report.xml"
    
    if [[ ! -f "$resharper_report" ]]; then
        print_error "ReSharper report not found: $resharper_report"
        print_info "Run: ./scripts/pr-quality-check.sh to generate report"
        return 1
    fi
    
    # Parse ReSharper report for issues count
    local issues_count
    if command -v xmllint &> /dev/null; then
        issues_count=$(xmllint --xpath "count(//Issue)" "$resharper_report" 2>/dev/null || echo "unknown")
    else
        # Fallback parsing without xmllint
        issues_count=$(grep -c "<Issue " "$resharper_report" 2>/dev/null || echo "unknown")
    fi
    
    if [[ "$issues_count" == "unknown" ]]; then
        print_warning "Could not parse ReSharper report"
        return 0
    fi
    
    local max_allowed_issues=0
    
    if [[ "$issues_count" -gt "$max_allowed_issues" ]]; then
        print_error "Code analysis found $issues_count ReSharper issues (zero tolerance policy)"
        print_info "Launching Claude Quality Reviewer to analyze and fix ReSharper + SonarAnalyzer issues..."
        
        # Auto-launch Claude reviewer
        if "$SCRIPT_DIR/claude-quality-reviewer.sh"; then
            print_success "Claude successfully resolved all code analysis issues!"
            # Regenerate reports after fixes
            print_info "Regenerating quality reports after fixes..."
            if "$SCRIPT_DIR/pr-quality-check.sh" > /dev/null 2>&1; then
                print_success "Quality reports updated - commit can proceed"
                return 0
            else
                print_error "Quality check failed after Claude's fixes"
                return 1
            fi
        else
            print_error "Claude could not resolve all issues automatically"
            print_info "Manual review required - check reports/claude-review-log.md"
            return 1
        fi
    fi
    
    print_success "Code analysis passed (zero issues - perfect code quality!)"
    return 0
}

check_test_results() {
    print_info "Checking test results..."
    
    local test_report="$REPORTS_DIR/test-results.trx"
    
    if [[ ! -f "$test_report" ]]; then
        print_error "Test results not found: $test_report"
        print_info "Run: ./scripts/pr-quality-check.sh to generate test results"
        return 1
    fi
    
    # Check for test failures in TRX format
    if grep -q 'outcome="Failed"' "$test_report"; then
        local failed_count
        failed_count=$(grep -c 'outcome="Failed"' "$test_report")
        print_error "Found $failed_count failing test(s)"
        print_info "Fix failing tests before committing"
        return 1
    fi
    
    print_success "All tests passing"
    return 0
}

check_code_formatting() {
    print_info "Checking code formatting..."
    
    # Check if there are unformatted files
    cd "$PROJECT_ROOT"
    
    # Run dotnet format in verify mode (non-destructive)
    if ! dotnet format --verify-no-changes --verbosity quiet; then
        print_error "Code formatting issues detected"
        print_info "Run: dotnet format to fix formatting issues"
        return 1
    fi
    
    print_success "Code formatting is correct"
    return 0
}

run_quality_gate() {
    print_header
    
    # Call the pre-commit validation API
    call_pre_commit_api
    
    print_success "All quality gates passed! ✨"
    print_info "Proceeding with commit..."
}

# Allow bypassing quality gate with environment variable
if [[ "$SKIP_QUALITY_GATE" == "true" ]]; then
    print_warning "Quality gate bypassed via SKIP_QUALITY_GATE environment variable"
    exit 0
fi

# Allow bypassing for merge commits
if git log -1 --pretty=%B | grep -q "^Merge "; then
    print_info "Merge commit detected, skipping quality gate"
    exit 0
fi

# Run quality gate
run_quality_gate