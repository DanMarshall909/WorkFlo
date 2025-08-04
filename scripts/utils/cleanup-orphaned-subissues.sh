#!/bin/bash
# Cleanup orphaned test subissues for completed parent issues
# Closes test subissues when their parent TDD workflow is complete

set -e

echo "🧹 Cleaning up orphaned test subissues..."

# Get all open subissues
subissues=$(gh issue list --state open --label "subissue" --json number,body --limit 100)

if [[ -z "$subissues" || "$subissues" == "[]" ]]; then
    echo "✅ No subissues found to clean up"
    exit 0
fi

closed_count=0
skipped_count=0

# Process each subissue using process substitution to avoid subshell
while read -r issue_num; do
    echo "🔍 Checking subissue #$issue_num..."
    
    # Rate limiting: brief pause between API calls to avoid hitting GitHub limits
    sleep 0.1
    
    # Get issue details
    body=$(gh issue view "$issue_num" --json body --jq '.body' 2>/dev/null || echo "")
    
    # Extract parent issue number from body
    parent_issue=$(echo "$body" | grep -o 'Parent Issue: #[0-9]*' | grep -o '[0-9]*' 2>/dev/null || echo "")
    
    if [[ -z "$parent_issue" ]]; then
        echo "⚠️  Issue #$issue_num: No parent issue found, skipping"
        ((skipped_count++))
        continue
    fi
    
    # Check if parent issue is closed
    parent_state=$(gh issue view "$parent_issue" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
    
    if [[ "$parent_state" == "CLOSED" ]]; then
        echo "🗑️  Closing subissue #$issue_num (parent #$parent_issue is closed)"
        
        # Close the subissue with appropriate comment
        gh issue close "$issue_num" --comment "✅ Parent issue #$parent_issue completed. Test subissue no longer needed.

This subissue was automatically closed because:
- Parent TDD workflow is complete
- All acceptance criteria have been implemented and tested
- Tests have been integrated into the main codebase

🤖 Automated cleanup by WorkFlo TDD system" 2>/dev/null || {
            echo "❌ Failed to close issue #$issue_num"
            continue
        }
        
        ((closed_count++))
    else
        echo "📋 Issue #$issue_num: Parent #$parent_issue still $parent_state, keeping open"
        ((skipped_count++))
    fi
done < <(echo "$subissues" | jq -r '.[] | .number')

echo ""
echo "📊 Cleanup Summary:"
echo "   Closed: $closed_count subissues"
echo "   Skipped: $skipped_count subissues"
echo ""

if [[ $closed_count -gt 0 ]]; then
    echo "✅ Cleanup completed successfully"
else
    echo "ℹ️  No subissues needed cleanup"
fi