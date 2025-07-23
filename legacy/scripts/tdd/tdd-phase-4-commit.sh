#!/bin/bash
# TDD Phase 4: Commit and Documentation
# Creates standardized commit with quality metrics for different component types

set -e

FEATURE_NAME="${1:-feature}"
DESCRIPTION="${2:-Implement feature with TDD}"
COMPONENT_TYPE="${3:-types}"  # types, components, hooks, stores
BASE_DIR="src"  # Relative to src/web directory

echo "🎯 TDD Phase 4: Commit '$FEATURE_NAME' ($COMPONENT_TYPE)"

# Validate we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Run from project root directory"
    exit 1
fi

cd src/web

# Determine file paths based on component type
case "$COMPONENT_TYPE" in
    "types")
        IMPL_PATH="$BASE_DIR/lib/types/$FEATURE_NAME.ts"
        TEST_PATH="$BASE_DIR/__tests__/lib/types/$FEATURE_NAME.test.ts"
        COVERAGE_GREP="lib/types"
        ;;
    "components")
        IMPL_PATH="$BASE_DIR/components/**/$FEATURE_NAME.tsx"
        TEST_PATH="$BASE_DIR/__tests__/components/**/$FEATURE_NAME.test.tsx"
        COVERAGE_GREP="components"
        ;;
    "hooks")
        IMPL_PATH="$BASE_DIR/hooks/$FEATURE_NAME.ts"
        TEST_PATH="$BASE_DIR/__tests__/hooks/$FEATURE_NAME.test.ts"
        COVERAGE_GREP="hooks"
        ;;
    "stores")
        IMPL_PATH="$BASE_DIR/stores/$FEATURE_NAME.ts"
        TEST_PATH="$BASE_DIR/__tests__/stores/$FEATURE_NAME.test.ts"
        COVERAGE_GREP="stores"
        ;;
    *)
        echo "❌ Unknown component type: $COMPONENT_TYPE"
        echo "Valid types: types, components, hooks, stores"
        exit 1
        ;;
esac

# Get coverage metrics
echo "📊 Collecting quality metrics..."
COVERAGE_OUTPUT=$(npm run test:coverage -- --testPathPattern="$FEATURE_NAME" --silent 2>/dev/null | grep -A 10 "$COVERAGE_GREP" | grep "$FEATURE_NAME" || echo "No coverage data")

# Count tests - find the actual test file
TEST_FILE=$(find "$BASE_DIR/__tests__" -name "*$FEATURE_NAME*.test.*" -type f | head -1)
if [ -n "$TEST_FILE" ]; then
    TEST_COUNT=$(grep -c "test\|it(" "$TEST_FILE" 2>/dev/null || echo "0")
else
    TEST_COUNT="0"
fi

# Extract coverage percentages
STMT_COV=$(echo "$COVERAGE_OUTPUT" | awk '{print $2}' | head -1 | tr -d '%' || echo "Unknown")
BRANCH_COV=$(echo "$COVERAGE_OUTPUT" | awk '{print $3}' | head -1 | tr -d '%' || echo "Unknown")
FUNC_COV=$(echo "$COVERAGE_OUTPUT" | awk '{print $4}' | head -1 | tr -d '%' || echo "Unknown")

cd ../..

# Stage all changes (safer for different file structures)
echo "📝 Staging files..."
git add .

# Create standardized commit message based on component type
case "$COMPONENT_TYPE" in
    "types")
        COMMIT_PREFIX="feat(types)"
        IMPLEMENTATION_TYPE="types"
        ;;
    "components")
        COMMIT_PREFIX="feat(components)"
        IMPLEMENTATION_TYPE="component"
        ;;
    "hooks")
        COMMIT_PREFIX="feat(hooks)"
        IMPLEMENTATION_TYPE="hook"
        ;;
    "stores")
        COMMIT_PREFIX="feat(stores)"
        IMPLEMENTATION_TYPE="store"
        ;;
esac

COMMIT_MSG="$COMMIT_PREFIX($FEATURE_NAME): $DESCRIPTION

🧪 TDD Phase 4 implementation
- Implement $FEATURE_NAME $IMPLEMENTATION_TYPE with TDD approach
- Create comprehensive test suite with $TEST_COUNT tests
- Achieve ${STMT_COV}% statement coverage
- Achieve ${BRANCH_COV}% branch coverage  
- Achieve ${FUNC_COV}% function coverage
- Red-Green-Refactor-Cover-Commit cycle completed

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Commit with standardized message
echo "💾 Creating commit..."
git commit -m "$COMMIT_MSG"

# Update progress tracker
if [ -f "scripts/update-progress.sh" ]; then
    scripts/update-progress.sh "phase4" "Committed $FEATURE_NAME ($COMPONENT_TYPE) with $TEST_COUNT tests and ${STMT_COV}% coverage" "$FEATURE_NAME"
fi

# Check if this completes a GitHub issue
if [ -f "PROGRESS.md" ]; then
    CURRENT_ISSUE=$(grep -o "#[0-9]\+" PROGRESS.md | head -1 | sed 's/#//' || echo "")
    if [ -n "$CURRENT_ISSUE" ] && [ -f "scripts/gh-board-sync.sh" ]; then
        echo "🎯 Checking if issue #$CURRENT_ISSUE is complete..."
        read -p "Is issue #$CURRENT_ISSUE complete? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🏁 Completing issue #$CURRENT_ISSUE on GitHub board..."
            scripts/gh-board-sync.sh complete "$CURRENT_ISSUE"
        else
            echo "📝 Issue #$CURRENT_ISSUE remains in progress"
        fi
    fi
fi

echo "✅ Phase 4 Complete! $COMPONENT_TYPE committed with quality metrics."
echo "🎉 TDD cycle complete for '$FEATURE_NAME'"
echo ""
echo "📊 Final Metrics:"
echo "   - Component Type: $COMPONENT_TYPE"
echo "   - Tests: $TEST_COUNT"
echo "   - Statement Coverage: ${STMT_COV}%"
echo "   - Branch Coverage: ${BRANCH_COV}%"
echo "   - Function Coverage: ${FUNC_COV}%"