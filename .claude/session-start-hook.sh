#!/bin/bash
# Session start hook to remind about TDD workflow

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🚨 WORKFLO TDD WORKFLOW REMINDER"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Working on an issue with acceptance criteria? You MUST use:"
echo ""
echo "  flo tdd:start <issue>    - Begin TDD workflow"
echo "  flo tdd:status           - Check current state"
echo "  flo tdd:red              - Write failing test"
echo "  flo tdd:green            - Minimal implementation"
echo "  flo tdd:refactor         - Improve code"
echo "  flo tdd:cover            - Add more tests"
echo "  flo tdd:next             - Move to next AC"
echo ""
echo "❌ NEVER edit files directly for issues with ACs!"
echo "✅ ALWAYS follow: RED → GREEN → REFACTOR → COVER → NEXT"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Check for active TDD session
if [ -f ".tdd-state" ]; then
  echo "📍 Active TDD Session Detected!"
  ISSUE=$(jq -r '.issueNumber' .tdd-state 2>/dev/null || echo "unknown")
  PHASE=$(jq -r '.phase' .tdd-state 2>/dev/null || echo "unknown")
  CRITERIA=$(jq -r '.currentCriteria' .tdd-state 2>/dev/null || echo "unknown")
  
  echo "   Issue: #$ISSUE"
  echo "   Phase: $PHASE"
  echo "   Current AC: $CRITERIA"
  echo ""
  echo "Continue with: flo tdd:$PHASE"
  echo "════════════════════════════════════════════════════════════"
  echo ""
fi

# Check for override
if [ "$TDD_OVERRIDE" = "true" ] || [ "$TDD_OVERRIDE" = "1" ]; then
  echo ""
  echo "⚠️  ⚠️  ⚠️  WARNING: TDD ENFORCEMENT DISABLED ⚠️  ⚠️  ⚠️"
  echo ""
  echo "TDD_OVERRIDE=$TDD_OVERRIDE"
  echo ""
  echo "To re-enable enforcement:"
  echo "  unset TDD_OVERRIDE"
  echo "════════════════════════════════════════════════════════════"
fi