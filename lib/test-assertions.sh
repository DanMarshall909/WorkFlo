#!/bin/bash
# Test assertion library for WorkFlo testing
# Provides structured assertions with clear error reporting

# Global test state
TEST_ERRORS=${TEST_ERRORS:-0}
TEST_ASSERTIONS=${TEST_ASSERTIONS:-0}

# Assert that two values are equal
assert_equals() {
    local expected="$1"
    local actual="$2"
    local message="${3:-Assertion failed}"
    
    ((TEST_ASSERTIONS++))
    
    if [ "$expected" = "$actual" ]; then
        echo "✅ PASS: $message (expected: '$expected', got: '$actual')"
        return 0
    else
        echo "❌ FAIL: $message (expected: '$expected', got: '$actual')"
        ((TEST_ERRORS++))
        return 1
    fi
}

# Assert that a value is true
assert_true() {
    local value="$1"
    local message="${2:-Value should be true}"
    
    assert_equals "true" "$value" "$message"
}

# Assert that a value is false
assert_false() {
    local value="$1"
    local message="${2:-Value should be false}"
    
    assert_equals "false" "$value" "$message"
}

# Assert that a string contains a substring
assert_contains() {
    local haystack="$1"
    local needle="$2"
    local message="${3:-String should contain substring}"
    
    ((TEST_ASSERTIONS++))
    
    if [[ "$haystack" == *"$needle"* ]]; then
        echo "✅ PASS: $message ('$haystack' contains '$needle')"
        return 0
    else
        echo "❌ FAIL: $message ('$haystack' does not contain '$needle')"
        ((TEST_ERRORS++))
        return 1
    fi
}

# Assert that a command succeeds
assert_command_succeeds() {
    local command="$1"
    local message="${2:-Command should succeed}"
    
    ((TEST_ASSERTIONS++))
    
    if eval "$command" >/dev/null 2>&1; then
        echo "✅ PASS: $message ('$command' succeeded)"
        return 0
    else
        echo "❌ FAIL: $message ('$command' failed)"
        ((TEST_ERRORS++))
        return 1
    fi
}

# Print test summary and exit with appropriate code
test_summary() {
    echo ""
    echo "📊 Test Summary:"
    echo "   Assertions: $TEST_ASSERTIONS"
    echo "   Failures: $TEST_ERRORS"
    
    if [ $TEST_ASSERTIONS -gt 0 ]; then
        echo "   Success Rate: $(( (TEST_ASSERTIONS - TEST_ERRORS) * 100 / TEST_ASSERTIONS ))%"
    else
        echo "   Success Rate: N/A (no assertions)"
    fi
    
    if [ $TEST_ERRORS -eq 0 ]; then
        echo "🎉 All tests passed!"
        exit 0
    else
        echo "💥 $TEST_ERRORS test(s) failed!"
        exit 1
    fi
}

# Export functions for use in test scripts
export -f assert_equals
export -f assert_true
export -f assert_false
export -f assert_contains
export -f assert_command_succeeds
export -f test_summary