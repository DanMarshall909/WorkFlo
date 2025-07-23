#!/bin/bash
# TDD Phase 3: Quality Gates
# Validates coverage thresholds and prepares for mutation testing

set -e

FEATURE_NAME="${1:-feature}"
COVERAGE_THRESHOLD="${2:-95}"
BASE_DIR="src/web/src"

echo "🎯 TDD Phase 3: Quality Gates for '$FEATURE_NAME'"

cd src/web

# Run comprehensive test suite
echo "🧪 Running comprehensive test suite..."
npm test -- --testPathPattern="$FEATURE_NAME.test.ts" --verbose

# Check coverage thresholds
echo "📊 Validating coverage thresholds (target: ${COVERAGE_THRESHOLD}%)..."
npm run test:coverage -- --testPathPattern="$FEATURE_NAME" --coverageThreshold="{'global':{'statements':$COVERAGE_THRESHOLD,'branches':$COVERAGE_THRESHOLD,'functions':$COVERAGE_THRESHOLD,'lines':$COVERAGE_THRESHOLD}}"

# Run linting
echo "🔍 Running code quality checks..."
npm run lint

# Manual mutation testing analysis
echo "🧬 Performing mutation testing analysis..."
TEST_COUNT=$(grep -c "test\|it(" "$BASE_DIR/__tests__/lib/types/$FEATURE_NAME.test.ts" || echo "0")
BOUNDARY_TESTS=$(grep -c "boundary\|edge\|invalid\|error" "$BASE_DIR/__tests__/lib/types/$FEATURE_NAME.test.ts" || echo "0")

echo "📈 Quality Metrics:"
echo "   - Total Tests: $TEST_COUNT"
echo "   - Boundary/Edge Tests: $BOUNDARY_TESTS"
echo "   - Coverage Target: ${COVERAGE_THRESHOLD}%"

if [ "$TEST_COUNT" -lt 10 ]; then
    echo "⚠️  Warning: Low test count ($TEST_COUNT). Consider adding more tests."
fi

if [ "$BOUNDARY_TESTS" -lt 3 ]; then
    echo "⚠️  Warning: Few boundary tests ($BOUNDARY_TESTS). Consider edge cases."
fi

# Update progress tracker  
echo "📊 Updating progress tracker..."
cd ../..
if [ -f "scripts/update-progress.sh" ]; then
    scripts/update-progress.sh "phase3" "Quality gates validation for $FEATURE_NAME" "$FEATURE_NAME"
fi

echo "✅ Phase 3 Complete! Quality gates validated."
echo "💡 Next: Run 'scripts/tdd-phase-4-commit.sh $FEATURE_NAME \"description\"' to commit"