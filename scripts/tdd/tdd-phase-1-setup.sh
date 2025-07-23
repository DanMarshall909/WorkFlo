#!/bin/bash
# TDD Phase 1: Setup and Planning
# Creates directory structure and planning documents for a new feature

set -e

FEATURE_NAME="${1:-feature}"
BASE_DIR="${2:-src/web/src}"

echo "🔧 TDD Phase 1: Setup for '$FEATURE_NAME'"

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$BASE_DIR/lib/types"
mkdir -p "$BASE_DIR/components/$FEATURE_NAME"
mkdir -p "$BASE_DIR/__tests__/lib/types"
mkdir -p "$BASE_DIR/__tests__/components/$FEATURE_NAME"
mkdir -p "$BASE_DIR/hooks"
mkdir -p "$BASE_DIR/__tests__/hooks"

echo "✅ Directory structure created:"
echo "   - Types: $BASE_DIR/lib/types/"
echo "   - Components: $BASE_DIR/components/$FEATURE_NAME/"
echo "   - Hooks: $BASE_DIR/hooks/"
echo "   - Tests: $BASE_DIR/__tests__/"

# Update progress tracker
echo "📊 Updating progress tracker..."
if [ -f "scripts/update-progress.sh" ]; then
    scripts/update-progress.sh "phase1" "Setup directory structure for $FEATURE_NAME" "$FEATURE_NAME"
fi

echo "🎯 Phase 1 Complete! Ready for type definition phase."
echo "💡 Next: Run 'scripts/tdd-phase-2-types.sh $FEATURE_NAME' to continue"