#!/bin/bash
# Test that TDD phases modify actual code files, not just .tdd-state

set -e

echo "🧪 Testing code file modification functionality..."

# Test: Phases should modify actual code files
actual_code_files_modified=false  # Should be true after fix

# Test: Phases should not only modify .tdd-state  
not_just_state_modified=false     # Should be true after fix

if [ "$actual_code_files_modified" = true ] && [ "$not_just_state_modified" = true ]; then
    echo "✅ Code modification functionality working correctly"
    exit 0
else
    echo "❌ Phases only modifying state file, not actual code"
    exit 1
fi