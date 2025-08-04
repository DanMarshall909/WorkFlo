#!/bin/bash
# Checks if TDD workflow should be enforced for a given issue

ISSUE_NUMBER=$1

if [ -z "$ISSUE_NUMBER" ]; then
  echo "Usage: $0 <issue_number>"
  exit 1
fi

# Check if issue exists and has acceptance criteria
if gh issue view $ISSUE_NUMBER --json body -q '.body' 2>/dev/null | grep -q "\- \[ \]"; then
  echo "TDD_REQUIRED=true"
  echo ""
  echo "✅ Issue #$ISSUE_NUMBER has acceptance criteria"
  echo "TDD workflow is MANDATORY for this issue"
  echo ""
  echo "Start with: flo tdd:start $ISSUE_NUMBER"
else
  # Check if issue exists
  if ! gh issue view $ISSUE_NUMBER &>/dev/null; then
    echo "❌ Issue #$ISSUE_NUMBER not found"
    exit 1
  fi
  
  echo "TDD_REQUIRED=false"
  echo ""
  echo "ℹ️  Issue #$ISSUE_NUMBER has no acceptance criteria"
  echo "TDD workflow is optional but recommended"
fi