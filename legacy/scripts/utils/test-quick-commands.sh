#!/bin/bash

# Test Script for Quick Commands
# Validates all quick command aliases work correctly

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    ((TESTS_RUN++))
    log "Testing: $test_name"
    
    # Run command and capture output
    local output
    if output=$(eval "$command" 2>&1); then
        if [[ "$output" =~ $expected_pattern ]]; then
            success "$test_name - Command executed and pattern matched"
            ((TESTS_PASSED++))
        else
            error "$test_name - Command executed but pattern not found"
            echo "Expected pattern: $expected_pattern"
            echo "Actual output: $output"
        fi
    else
        error "$test_name - Command failed to execute"
        echo "Output: $output"
    fi
    echo ""
}

# Start tests
echo -e "${BLUE}🧪 Testing Quick Commands${NC}"
echo "================================="
echo ""

# Test 1: sw (Start Work) help
log "Test 1: ./sw help command"
run_test "Start Work Help" "./sw help" "Enhanced Start Work Script"

# Test 2: gb (GitHub Board) help  
log "Test 2: ./gb help command"
run_test "GitHub Board Help" "./gb help" "GitHub Project Board Automation"

# Test 3: tdd help
log "Test 3: ./tdd help (should show usage error)"
run_test "TDD Help" "./tdd 2>&1 || true" "TDD Phase 4"

# Test 4: tdh help  
log "Test 4: ./tdh help (should show usage error)"
run_test "TDD Hooks Help" "./tdh 2>&1 || true" "TDD.*hooks"

# Test 5: qc help
log "Test 5: ./qc help command"
run_test "Quality Check Help" "./qc --help 2>&1 || true" "quality.*check|PR.*Quality"

# Test file existence
log "Testing file existence and permissions..."

FILES=("sw" "gb" "tdd" "tdh" "qc")
for file in "${FILES[@]}"; do
    ((TESTS_RUN++))
    if [[ -f "./$file" && -x "./$file" ]]; then
        success "File ./$file exists and is executable"
        ((TESTS_PASSED++))
    else
        error "File ./$file missing or not executable"
    fi
done

# Test script paths
log "Testing script path references..."

SCRIPT_TESTS=(
    "sw:enhanced-start-work.sh"
    "gb:gh-board-sync.sh" 
    "tdd:tdd-phase-4-commit.sh"
    "tdh:tdd-hooks-commit.sh"
    "qc:pr-quality-check.sh"
)

for test_item in "${SCRIPT_TESTS[@]}"; do
    IFS=':' read -r quick_cmd script_name <<< "$test_item"
    ((TESTS_RUN++))
    
    if [[ -f "./scripts/$script_name" ]]; then
        success "Target script ./scripts/$script_name exists for ./$quick_cmd"
        ((TESTS_PASSED++))
    else
        error "Target script ./scripts/$script_name missing for ./$quick_cmd"
    fi
done

# Test GitHub CLI availability (for gb command)
log "Testing GitHub CLI availability..."
((TESTS_RUN++))
if command -v gh >/dev/null 2>&1; then
    success "GitHub CLI (gh) is available"
    ((TESTS_PASSED++))
else
    warn "GitHub CLI (gh) not found - ./gb command may not work fully"
fi

# Test git repository
log "Testing git repository..."
((TESTS_RUN++))
if git status >/dev/null 2>&1; then
    success "Git repository detected"
    ((TESTS_PASSED++))
else
    error "Not in a git repository - commands may not work"
fi

# Test CLAUDE.md references
log "Testing CLAUDE.md references..."
((TESTS_RUN++))
if grep -q "./sw" CLAUDE.md && grep -q "./gb" CLAUDE.md; then
    success "CLAUDE.md contains quick command references"
    ((TESTS_PASSED++))
else
    error "CLAUDE.md missing quick command references"
fi

# Summary
echo ""
echo -e "${BLUE}📊 Test Summary${NC}"
echo "================"
echo "Tests Run: $TESTS_RUN"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $((TESTS_RUN - TESTS_PASSED))"
echo ""

if [[ $TESTS_PASSED -eq $TESTS_RUN ]]; then
    echo -e "${GREEN}✅ All tests passed! Quick commands are ready to use.${NC}"
    echo ""
    echo -e "${BLUE}🚀 Quick Command Summary:${NC}"
    echo "  ./sw                    # Start work (issue selection)"
    echo "  ./gb show              # View GitHub board"
    echo "  ./gb start 73          # Start issue #73"
    echo "  ./gb complete 73       # Complete issue #73"
    echo "  ./tdd name \"desc\"      # TDD commit for features"
    echo "  ./tdh name \"desc\"      # TDD commit for hooks"
    echo "  ./qc                   # Quality check"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the output above.${NC}"
    exit 1
fi