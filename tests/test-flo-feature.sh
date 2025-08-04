#!/bin/bash
# Test suite for 'flo feature' command

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
PASS=0
FAIL=0

assert_file_exists() {
    local file="$1"
    local description="$2"
    
    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $description"
        echo "   Expected file: $file"
        ((FAIL++))
    fi
}

assert_command_exists() {
    local cmd="$1"
    local description="$2"
    
    if command -v "$cmd" >/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $description"
        echo "   Expected command: $cmd"
        ((FAIL++))
    fi
}

test_flo_feature_command_exists() {
    echo "Testing: flo feature command exists and works"
    
    # This test MUST fail during RED phase - flo feature subcommand doesn't exist yet
    if ./flo feature 123 2>/dev/null; then
        echo -e "${GREEN}✓${NC} flo feature command works"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} flo feature command does not exist or failed"
        echo "   Expected: ./flo feature <issue> should work"
        ((FAIL++))
    fi
}

test_flo_feature_automates_workflow() {
    echo "Testing: flo feature automates complete TDD workflow"
    
    # This test will fail until we implement the flo feature command
    if ./flo feature 999 2>/dev/null; then
        echo -e "${GREEN}✓${NC} flo feature command executed successfully"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} flo feature command failed (expected - not implemented yet)"
        ((FAIL++))
    fi
}

test_flo_feature_handles_branch_creation() {
    echo "Testing: flo feature creates branches and runs TDD phases"
    
    # This test will fail until implementation
    output=$(./flo feature 123 2>&1 || true)
    if [[ "$output" == *"feature/issue-123"* ]]; then
        echo -e "${GREEN}✓${NC} Creates feature branch correctly"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} Does not create feature branch (expected - not implemented yet)"
        ((FAIL++))
    fi
}

test_flo_feature_error_handling() {
    echo "Testing: flo feature handles errors and reopens subissues"
    
    # This test will fail until implementation
    export SIMULATE_ERROR=true
    output=$(./flo feature 456 2>&1 || true)
    if [[ "$output" == *"Reopening subissue"* ]]; then
        echo -e "${GREEN}✓${NC} Handles errors and reopens subissues"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} Does not handle errors properly (expected - not implemented yet)"
        ((FAIL++))
    fi
}

echo "Running Flo Feature Command Tests"
echo "================================="

test_flo_feature_command_exists
echo
test_flo_feature_automates_workflow  
echo
test_flo_feature_handles_branch_creation
echo
test_flo_feature_error_handling

echo
echo "Test Results:"
echo "============="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"

if [[ $FAIL -gt 0 ]]; then
    echo "Some tests failed (expected during RED phase)"
    exit 1
else
    echo "All tests passed!"
    exit 0
fi