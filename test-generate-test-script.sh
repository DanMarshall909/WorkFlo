#!/bin/bash
# Unit tests for generate-test-script.sh utility
# Related to code review improvements: testing new functionality

set -e

# Load test assertion library
source "$(dirname "$0")/lib/test-assertions.sh" 2>/dev/null || {
    echo "⚠️ Test assertion library not found, using basic assertions"
    assert_true() { [ "$1" = true ] || { echo "❌ FAIL: $2"; return 1; }; }
    assert_false() { [ "$1" = false ] || { echo "❌ FAIL: $2"; return 1; }; }
    assert_equals() { [ "$1" = "$2" ] || { echo "❌ FAIL: $3"; return 1; }; }
    assert_command_succeeds() { eval "$1" >/dev/null 2>&1 || { echo "❌ FAIL: $2"; return 1; }; }
    test_summary() { echo "📊 Test completed"; }
}

echo "🧪 Testing generate-test-script.sh utility..."
echo ""

# Test 1: Script exists and is executable
test_script_exists() {
    echo "🔍 Test 1: Script exists and is executable"
    if [[ -x ./generate-test-script.sh ]]; then
        echo "✅ PASS: generate-test-script.sh is executable"
        return 0
    else
        echo "❌ FAIL: generate-test-script.sh should be executable"
        return 1
    fi
}

# Test 2: Usage message when no arguments provided
test_usage_message() {
    echo "🔍 Test 2: Usage message when no arguments provided"
    local output
    output=$(./generate-test-script.sh 2>&1 || true)
    
    if echo "$output" | grep -q "Usage:"; then
        echo "✅ PASS: Usage message displayed correctly"
    else
        echo "❌ FAIL: Usage message not displayed when no arguments provided"
        return 1
    fi
}

# Test 3: Test script generation with valid inputs
test_script_generation() {
    echo "🔍 Test 3: Test script generation with valid inputs"
    
    # Clean up any existing test file
    rm -f test-sample-168.sh
    
    # Generate test script
    local output
    output=$(./generate-test-script.sh 168 test-sample-168 "Sample test description" 2>&1)
    
    # Check if file was created
    if [[ -f test-sample-168.sh ]]; then
        echo "✅ PASS: Generated test script exists"
    else
        echo "❌ FAIL: Generated test script should exist"
        return 1
    fi
    
    # Check if file is executable
    if [[ -x test-sample-168.sh ]]; then
        echo "✅ PASS: Generated test script is executable"
    else
        echo "❌ FAIL: Generated test script should be executable"
        rm -f test-sample-168.sh
        return 1
    fi
    
    # Check file contents
    local content
    content=$(cat test-sample-168.sh)
    
    # Verify issue number is embedded
    if echo "$content" | grep -q "#168"; then
        echo "✅ PASS: Issue number embedded in test script"
    else
        echo "❌ FAIL: Issue number not found in generated script"
        rm -f test-sample-168.sh
        return 1
    fi
    
    # Verify shebang line
    if echo "$content" | head -1 | grep -q "#!/bin/bash"; then
        echo "✅ PASS: Proper shebang line present"
    else
        echo "❌ FAIL: Missing or incorrect shebang line"
        rm -f test-sample-168.sh
        return 1
    fi
    
    # Verify test assertion library integration
    if echo "$content" | grep -q "test-assertions.sh"; then
        echo "✅ PASS: Test assertion library integration present"
    else
        echo "❌ FAIL: Test assertion library integration missing"
        rm -f test-sample-168.sh
        return 1
    fi
    
    # Clean up
    rm -f test-sample-168.sh
}

# Test 4: Name sanitization
test_name_sanitization() {
    echo "🔍 Test 4: Name sanitization"
    
    # Clean up any existing test files
    rm -f test-special-chars.sh
    
    # Generate test with special characters in name
    ./generate-test-script.sh 168 "Test@Special#Chars!" "Test description" >/dev/null 2>&1
    
    # Check if properly sanitized file was created
    if [[ -f testspecialchars.sh ]]; then
        echo "✅ PASS: Special characters sanitized from filename"
    else
        echo "❌ FAIL: Special characters should be sanitized from filename"
        return 1
    fi
    
    # Clean up
    rm -f testspecialchars.sh
}

# Test 5: Generated script can be executed
test_generated_script_execution() {
    echo "🔍 Test 5: Generated script can be executed"
    
    # Clean up any existing test file
    rm -f test-execution-168.sh
    
    # Generate test script
    ./generate-test-script.sh 168 test-execution-168 "Execution test">/dev/null 2>&1
    
    # Try to execute the generated script
    if ./test-execution-168.sh >/dev/null 2>&1; then
        echo "✅ PASS: Generated script executes successfully"
    else
        echo "❌ FAIL: Generated script failed to execute"
        rm -f test-execution-168.sh
        return 1
    fi
    
    # Clean up
    rm -f test-execution-168.sh
}

# Run all tests
main() {
    local total_tests=5
    local passed_tests=0
    
    echo "Running $total_tests tests for generate-test-script.sh utility..."
    echo ""
    
    # Run each test and count successes
    if test_script_exists; then ((passed_tests++)); fi
    echo ""
    
    if test_usage_message; then ((passed_tests++)); fi
    echo ""
    
    if test_script_generation; then ((passed_tests++)); fi
    echo ""
    
    if test_name_sanitization; then ((passed_tests++)); fi
    echo ""
    
    if test_generated_script_execution; then ((passed_tests++)); fi
    echo ""
    
    # Display results
    echo "📊 Test Results:"
    echo "   Passed: $passed_tests/$total_tests tests"
    echo "   Success Rate: $(( passed_tests * 100 / total_tests ))%"
    
    if [[ $passed_tests -eq $total_tests ]]; then
        echo "✅ ALL TESTS PASSED"
        test_summary
        return 0
    else
        echo "❌ SOME TESTS FAILED"
        return 1
    fi
}

# Execute main test function
main "$@"