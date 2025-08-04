#!/bin/bash
# Hook that runs before file edits to check TDD state
# This helps ensure AI agents follow TDD workflow

echo "🔍 TDD Enforcement Check..."

# Get the file being edited
FILE_PATH="$1"

# Check if editing implementation files (not test files)
if [[ "$FILE_PATH" =~ \.(ts|js)$ ]] && [[ ! "$FILE_PATH" =~ \.test\. ]] && [[ ! "$FILE_PATH" =~ \.spec\. ]]; then
  echo "📝 Attempting to edit implementation file: $FILE_PATH"
  
  # Check for active TDD session
  if [ ! -f ".tdd-state" ]; then
    echo "❌ ERROR: No active TDD session!"
    echo ""
    echo "This issue requires TDD workflow. Start with:"
    echo "  flo tdd:start <issue>"
    echo "  OR"
    echo "  node flo-cli/dist/cli.js tdd:start <issue>"
    echo ""
    echo "Why? Issues with acceptance criteria must follow TDD"
    echo "to ensure quality, test coverage, and proper design."
    exit 1
  fi
  
  # Check current phase
  PHASE=$(jq -r '.phase' .tdd-state 2>/dev/null || echo "unknown")
  
  if [ "$PHASE" != "green" ] && [ "$PHASE" != "refactor" ]; then
    echo "❌ ERROR: Implementation only allowed in GREEN/REFACTOR phase!"
    echo ""
    echo "Current phase: $PHASE"
    echo ""
    echo "TDD Phase Rules:"
    echo "  RED phase: Write failing tests only"
    echo "  GREEN phase: Write minimal implementation"
    echo "  REFACTOR phase: Improve code quality"
    echo "  COVER phase: Add more tests"
    echo ""
    echo "Next step: Complete the $PHASE phase first"
    exit 1
  fi
  
  echo "✅ TDD check passed - in $PHASE phase"
fi

# Check if editing test files
if [[ "$FILE_PATH" =~ \.test\.(ts|js)$ ]] || [[ "$FILE_PATH" =~ \.spec\.(ts|js)$ ]]; then
  echo "📝 Attempting to edit test file: $FILE_PATH"
  
  if [ -f ".tdd-state" ]; then
    PHASE=$(jq -r '.phase' .tdd-state 2>/dev/null || echo "unknown")
    
    if [ "$PHASE" != "red" ] && [ "$PHASE" != "cover" ]; then
      echo "⚠️  WARNING: Test files usually edited in RED/COVER phases"
      echo "Current phase: $PHASE"
      echo ""
      echo "Continuing, but ensure you're following TDD properly."
    else
      echo "✅ TDD check passed - in $PHASE phase"
    fi
  fi
fi