#!/bin/bash
# TDD Phase 2: Type Definition
# Creates TypeScript types and initial test structure

set -e

FEATURE_NAME="${1:-feature}"
BASE_DIR="${2:-src/web/src}"

echo "🎯 TDD Phase 2: Type Definition for '$FEATURE_NAME'"

# Check if types file exists
TYPES_FILE="$BASE_DIR/lib/types/$FEATURE_NAME.ts"
TEST_FILE="$BASE_DIR/__tests__/lib/types/$FEATURE_NAME.test.ts"

if [ ! -f "$TYPES_FILE" ]; then
    echo "❌ Types file not found: $TYPES_FILE"
    echo "💡 Please create the types file first, then run this script"
    exit 1
fi

if [ ! -f "$TEST_FILE" ]; then
    echo "❌ Test file not found: $TEST_FILE" 
    echo "💡 Please create the test file first, then run this script"
    exit 1
fi

echo "📋 Running initial type validation..."

# Run TypeScript compilation check
echo "🔍 Checking TypeScript compilation..."
cd "$BASE_DIR/../.."
npx tsc --noEmit

# Run initial tests
echo "🧪 Running initial tests..."
npm test -- --testPathPattern="$FEATURE_NAME.test.ts"

# Run coverage check
echo "📊 Checking test coverage..."
npm run test:coverage -- --testPathPattern="$FEATURE_NAME"

# Update progress tracker
echo "📊 Updating progress tracker..."
if [ -f "scripts/update-progress.sh" ]; then
    scripts/update-progress.sh "phase2" "Type definition and initial testing for $FEATURE_NAME" "$FEATURE_NAME"
fi

echo "✅ Phase 2 Complete!"
echo "💡 Next: Run 'scripts/tdd-phase-3-quality.sh $FEATURE_NAME' for quality gates"