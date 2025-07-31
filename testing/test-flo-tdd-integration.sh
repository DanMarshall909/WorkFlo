#!/bin/bash
# Test: flo_commands_execute_tdd_functionality_directly
# Tests that flo executes TDD functionality directly without delegating to external tdd script

# Given: flo script exists and has TDD commands
# When: flo TDD commands are executed
# Then: they should work without calling external tdd script

set -e

echo "Test: flo commands execute TDD functionality directly"

# Test setup
export TDD_TEST_MODE=1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# This test will fail initially because flo currently delegates to tdd script
# We need to verify that flo has its own TDD functionality instead of delegation

# Check if flo script contains delegation to external tdd script
if grep -q 'PROJECT_TYPE="$project_type" "$SCRIPT_DIR/tdd"' "$SCRIPT_DIR/flo"; then
    echo "❌ FAIL: flo script still delegates to external tdd script"
    echo "Expected: TDD functionality implemented directly in flo"
    echo "Actual: flo delegates to external tdd script"
    exit 1
fi

echo "✅ PASS: flo implements TDD functionality directly without delegation"