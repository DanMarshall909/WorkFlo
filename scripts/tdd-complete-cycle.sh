#!/bin/bash
# TDD Complete Cycle
# Runs all TDD phases for existing implementations

set -e

FEATURE_NAME="${1:-feature}"
DESCRIPTION="${2:-Implement feature with TDD}"

echo "🎯 TDD Complete Cycle for '$FEATURE_NAME'"
echo "📋 Description: $DESCRIPTION"
echo ""

# Phase 2: Validate types (assuming setup already done)
echo "==== PHASE 2: TYPE VALIDATION ===="
scripts/tdd-phase-2-types.sh "$FEATURE_NAME"
echo ""

# Phase 3: Quality gates
echo "==== PHASE 3: QUALITY GATES ===="
scripts/tdd-phase-3-quality.sh "$FEATURE_NAME"
echo ""

# Phase 4: Commit
echo "==== PHASE 4: COMMIT ===="
scripts/tdd-phase-4-commit.sh "$FEATURE_NAME" "$DESCRIPTION"
echo ""

echo "🎉 Complete TDD cycle finished for '$FEATURE_NAME'!"
echo "✅ All phases passed successfully"