#!/bin/bash
# TDD Test Watcher - Automatically detect RED/GREEN phase completion
# Usage: ./scripts/tdd-test-watcher.sh [WATCH_MODE]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

WATCH_MODE="${1:-once}"

# Check current test status
check_test_status() {
    echo -e "${BLUE}🧪 Running test suite...${NC}"
    
    # Capture test output
    local test_output
    local test_exit_code
    
    test_output=$(dotnet test --verbosity normal 2>&1)
    test_exit_code=$?
    
    # Count passed/failed tests
    local passed_count=$(echo "$test_output" | grep -o "Passed:.*[0-9]" | grep -o "[0-9]*" | tail -1)
    local failed_count=$(echo "$test_output" | grep -o "Failed:.*[0-9]" | grep -o "[0-9]*" | tail -1)
    
    # Default to 0 if no matches
    passed_count=${passed_count:-0}
    failed_count=${failed_count:-0}
    
    echo -e "${BLUE}📊 Test Results: ${GREEN}$passed_count passed${NC}, ${RED}$failed_count failed${NC}"
    
    # Determine current phase based on test results
    if [[ $failed_count -gt 0 ]]; then
        echo -e "${RED}🔴 Tests failing - RED phase condition met${NC}"
        suggest_red_completion
    elif [[ $passed_count -gt 0 && $failed_count -eq 0 ]]; then
        echo -e "${GREEN}🟢 All tests passing - GREEN phase condition met${NC}"
        suggest_green_completion
    else
        echo -e "${YELLOW}⚠️  No tests found or ambiguous results${NC}"
    fi
    
    return $test_exit_code
}

# Suggest RED phase completion
suggest_red_completion() {
    local current_phase=$(detect_current_phase)
    
    if [[ "$current_phase" == "RED" ]]; then
        echo -e "${BLUE}💡 Ready to mark RED phase complete:${NC}"
        echo "   ./tdd red"
    fi
}

# Suggest GREEN phase completion  
suggest_green_completion() {
    local current_phase=$(detect_current_phase)
    
    if [[ "$current_phase" == "GREEN" ]]; then
        echo -e "${BLUE}💡 Ready to mark GREEN phase complete:${NC}"
        echo "   ./tdd green"
    fi
}

# Detect current TDD phase
detect_current_phase() {
    if ! grep -q "TDD Feature:" PROGRESS.md; then
        echo "NONE"
        return
    fi
    
    if ! grep -q "- RED: ✅" PROGRESS.md; then
        echo "RED"
    elif ! grep -q "- GREEN: ✅" PROGRESS.md; then
        echo "GREEN"
    elif ! grep -q "- REFACTOR: ✅" PROGRESS.md; then
        echo "REFACTOR"
    elif ! grep -q "- COVER: ✅" PROGRESS.md; then
        echo "COVER"
    elif ! grep -q "- COMMIT: ✅" PROGRESS.md; then
        echo "COMMIT"
    else
        echo "READY_FOR_NEXT"
    fi
}

# Watch mode - continuous monitoring
watch_tests() {
    echo -e "${CYAN}👁️  TDD Test Watcher - Monitoring test status...${NC}"
    echo "Press Ctrl+C to stop"
    
    while true; do
        clear
        echo -e "${CYAN}🔄 TDD Test Watcher - $(date)${NC}"
        echo "=================================="
        
        check_test_status
        
        echo ""
        echo -e "${BLUE}⏱️  Checking again in 5 seconds...${NC}"
        sleep 5
    done
}

# Main execution
main() {
    case "$WATCH_MODE" in
        "watch"|"w")
            watch_tests
            ;;
        "once"|*)
            check_test_status
            ;;
    esac
}

main "$@"