#!/bin/bash

# test-safe-commit.sh - Test safe-commit script behavior in different branch scenarios
# Validates that safe-commit works correctly with trunk-based development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

echo -e "${BLUE}🧪 Testing Safe Commit Script Behavior${NC}"
echo "========================================"

TEST_REPO="test-harness/test-repo"
if [[ ! -d "$TEST_REPO" ]]; then
    print_error "Test repository not found. Run ./test-harness/setup-test-repo.sh first"
    exit 1
fi

cd "$TEST_REPO"

# Store original location for cleanup
ORIGINAL_BRANCH=$(git symbolic-ref HEAD | sed 's|refs/heads/||' 2>/dev/null || echo "unknown")

# Test Results
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local branch="$2"
    local should_succeed="$3"
    
    print_info "Test: $test_name"
    
    # Switch to test branch
    git checkout "$branch" >/dev/null 2>&1 || {
        print_error "Failed to checkout branch $branch"
        ((TESTS_FAILED++))
        return 1
    }
    
    # Create a test file change
    echo "// Test change for $test_name" >> src/test-change.js
    git add src/test-change.js
    
    # Test safe-commit
    if ./scripts/safe-commit.sh "test: $test_name" >/dev/null 2>&1; then
        if [[ "$should_succeed" == "true" ]]; then
            print_success "✓ Safe commit worked on $branch (expected)"
            ((TESTS_PASSED++))
        else
            print_error "✗ Safe commit worked on $branch (should have been blocked)"
            ((TESTS_FAILED++))
        fi
    else
        if [[ "$should_succeed" == "false" ]]; then
            print_success "✓ Safe commit blocked on $branch (expected)"
            ((TESTS_PASSED++))
        else
            print_error "✗ Safe commit blocked on $branch (should have worked)"
            ((TESTS_FAILED++))
        fi
    fi
    
    # Cleanup test file
    git reset HEAD src/test-change.js >/dev/null 2>&1 || true
    rm -f src/test-change.js
}

# Test 1: Safe commit should work on master branch (trunk)
run_test "Commit on master branch" "master" "true"

# Test 2: Safe commit should work on feature branches
git checkout -b feature/test-feature master >/dev/null 2>&1
run_test "Commit on feature branch" "feature/test-feature" "true"

# Test 3: Safe commit should be blocked on main branch (production)
git checkout main >/dev/null 2>&1
run_test "Commit on main branch (should be blocked)" "main" "false"

# Test 4: Safe commit should work on test branches
git checkout -b test/123-456-test-branch master >/dev/null 2>&1
run_test "Commit on test branch" "test/123-456-test-branch" "true"

# Cleanup test branches
git checkout master >/dev/null 2>&1
git branch -D feature/test-feature test/123-456-test-branch >/dev/null 2>&1 || true

# Return to original branch
git checkout "$ORIGINAL_BRANCH" >/dev/null 2>&1 || git checkout master >/dev/null 2>&1

# Summary
echo ""
echo "========================================"
echo -e "${BLUE}Test Results Summary${NC}"
echo "========================================"
print_success "Tests Passed: $TESTS_PASSED"
if [[ $TESTS_FAILED -gt 0 ]]; then
    print_error "Tests Failed: $TESTS_FAILED"
    echo ""
    print_error "🛑 SAFE COMMIT BEHAVIOR VALIDATION FAILED"
    exit 1
else
    echo ""
    print_success "🎉 ALL SAFE COMMIT TESTS PASSED"
    print_info "Safe commit script correctly implements trunk-based development workflow"
fi