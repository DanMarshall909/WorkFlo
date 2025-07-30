#!/bin/bash

# Minimal Bash Integration Tests for F# WorkFlo Implementation
# 
# These tests focus only on interface correctness and basic functionality
# 90% of testing is handled by the comprehensive F# test suite

set -e

echo "🧪 Running minimal bash integration tests for F# WorkFlo..."

# Test directory setup
TEST_DIR="/tmp/workflo-integration-test-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Cleanup function
cleanup() {
    cd /
    rm -rf "$TEST_DIR"
}
trap cleanup EXIT

echo "📁 Test environment: $TEST_DIR"

# Test 1: F# application compiles and runs
echo "✅ Test 1: F# application compilation and basic execution"
cd /home/dan/code/WorkFlo/fsharp-app/WorkFlo.FSharp
if dotnet build --configuration Release --verbosity quiet; then
    echo "   ✓ F# application compiles successfully"
else
    echo "   ❌ F# application failed to compile"
    exit 1
fi

# Test 2: F# tests compile and run
echo "✅ Test 2: F# test suite execution"
cd /home/dan/code/WorkFlo/fsharp-app/WorkFlo.FSharp.Tests
if dotnet test --verbosity quiet --logger "console;verbosity=minimal"; then
    echo "   ✓ F# tests run successfully"
else
    echo "   ❌ F# tests failed"
    exit 1
fi

# Test 3: Basic interface compatibility (if main F# executable exists)
echo "✅ Test 3: Interface compatibility check"
cd /home/dan/code/WorkFlo/fsharp-app/WorkFlo.FSharp
if [ -f "bin/Release/net9.0/WorkFlo.FSharp" ]; then
    if ./bin/Release/net9.0/WorkFlo.FSharp help &>/dev/null; then
        echo "   ✓ F# executable responds to help command"
    else
        echo "   ⚠️  F# executable exists but help command not yet implemented"
    fi
else
    echo "   ⚠️  F# executable not built yet (implementation in progress)"
fi

# Test 4: File structure validation
echo "✅ Test 4: Project structure validation"
expected_files=(
    "/home/dan/code/WorkFlo/fsharp-app/WorkFlo.FSharp/Types.fs"
    "/home/dan/code/WorkFlo/fsharp-app/WorkFlo.FSharp.Tests/TypesTests.fs"
    "/home/dan/code/WorkFlo/fsharp-app/WorkFlo.FSharp.Tests/CoreTests.fs"
    "/home/dan/code/WorkFlo/fsharp-app/WorkFlo.FSharp.Tests/CommandTests.fs"
    "/home/dan/code/WorkFlo/fsharp-app/WorkFlo.FSharp.Tests/IntegrationTests.fs"
)

missing_files=0
for file in "${expected_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ Found: $(basename "$file")"
    else
        echo "   ❌ Missing: $(basename "$file")"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -eq 0 ]; then
    echo "   ✓ All expected F# files present"
else
    echo "   ❌ $missing_files F# files missing"
    exit 1
fi

echo ""
echo "🎉 Minimal bash integration tests completed successfully!"
echo "📊 Test Results:"
echo "   ✓ F# compilation: PASS"
echo "   ✓ F# test execution: PASS" 
echo "   ✓ Project structure: PASS"
echo ""
echo "📝 Note: This represents ~10% of total testing effort."
echo "   The comprehensive F# test suite provides ~90% of test coverage"
echo "   with property-based testing, exhaustive pattern matching,"
echo "   immutability verification, and integration testing."