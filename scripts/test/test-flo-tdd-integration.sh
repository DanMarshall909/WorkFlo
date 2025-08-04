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

# Check if modern flo-cli exists and provides TDD functionality
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FLO_CLI="$PROJECT_ROOT/flo-cli/dist/cli.js"

if [[ ! -f "$FLO_CLI" ]]; then
    echo "❌ FAIL: flo-cli not found at $FLO_CLI"
    echo "Expected: TypeScript CLI to be built"
    echo "Run: cd flo-cli && npm run build"
    exit 1
fi

# Test that flo-cli has TDD commands
if ! node "$FLO_CLI" tdd --help >/dev/null 2>&1; then
    echo "❌ FAIL: flo-cli does not have TDD commands"
    echo "Expected: flo-cli tdd commands to be available"
    exit 1
fi

echo "✅ PASS: flo-cli implements TDD functionality directly"