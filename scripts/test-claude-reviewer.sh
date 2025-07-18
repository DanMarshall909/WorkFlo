#!/bin/bash

# Test Claude Quality Reviewer System
# Runs the complete quality review process manually for testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}🧪 Testing Claude Quality Reviewer System${NC}"
    echo -e "${CYAN}===========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${YELLOW}📋 Step: $1${NC}"
}

run_test_sequence() {
    print_header
    echo ""
    
    print_step "1. Running initial quality check to identify issues"
    echo "   This will generate fresh reports and identify any ReSharper issues..."
    cd "$PROJECT_ROOT"
    ./scripts/pr-quality-check.sh
    
    echo ""
    print_step "2. Launching Claude Quality Reviewer"
    echo "   Claude will analyze issues and attempt automatic fixes..."
    ./scripts/claude-quality-reviewer.sh
    
    echo ""
    print_step "3. Running final quality verification"
    echo "   Verifying that all issues have been resolved..."
    if ./scripts/pr-quality-check.sh > /dev/null 2>&1; then
        print_success "Quality check passed after Claude's review!"
    else
        echo "   Running detailed quality check to show remaining issues..."
        ./scripts/pr-quality-check.sh
    fi
    
    echo ""
    print_step "4. Showing Claude's review log"
    if [[ -f "reports/claude-review-log.md" ]]; then
        echo "   Claude's review log:"
        echo "   ===================="
        cat reports/claude-review-log.md
    else
        print_info "No review log generated (no issues found)"
    fi
    
    echo ""
    print_step "5. Testing pre-commit hook simulation"
    echo "   Simulating what would happen during a git commit..."
    if ./scripts/pre-commit-quality-gate.sh; then
        print_success "Pre-commit hook would allow the commit!"
    else
        print_info "Pre-commit hook would block the commit (this is expected if issues remain)"
    fi
    
    echo ""
    print_success "Test sequence completed!"
    echo ""
    echo -e "${CYAN}📊 Summary:${NC}"
    echo "• Quality reports generated in: reports/"
    echo "• Claude's review log: reports/claude-review-log.md"
    echo "• ReSharper report: reports/resharper-report.xml"
    echo "• Quality summary: reports/pr-quality-report.html"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--help]"
        echo ""
        echo "Test the Claude Quality Reviewer system by running through"
        echo "the complete quality review and fix process."
        echo ""
        echo "This script will:"
        echo "1. Run quality checks to identify issues"
        echo "2. Launch Claude reviewer to analyze and fix issues"  
        echo "3. Verify that fixes were successful"
        echo "4. Show Claude's review log and decisions"
        echo "5. Test the pre-commit hook behavior"
        exit 0
        ;;
    "")
        run_test_sequence
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac