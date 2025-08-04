#!/bin/bash
# Bulk cleanup of all orphaned test subissues

echo "🧹 Bulk cleanup of orphaned test subissues..."

# Get all open subissues
open_subissues=$(gh issue list --state open --label "subissue" --json number --limit 100 | jq -r '.[] | .number')

echo "Found $(echo "$open_subissues" | wc -l) open subissues to check"

for issue in $open_subissues; do
    echo "Processing issue #$issue..."
    
    # Get parent issue from body
    parent=$(gh issue view "$issue" --json body --jq '.body' 2>/dev/null | grep -o 'Parent Issue: #[0-9]*' | grep -o '[0-9]*' 2>/dev/null || echo "")
    
    if [[ -n "$parent" ]]; then
        # Check if parent is closed
        parent_state=$(gh issue view "$parent" --json state --jq '.state' 2>/dev/null || echo "unknown")
        
        if [[ "$parent_state" == "CLOSED" ]]; then
            echo "  Closing #$issue (parent #$parent is closed)"
            gh issue close "$issue" --comment "✅ Parent issue #$parent completed. Test subissue no longer needed. 🤖 Automated cleanup" 2>/dev/null || echo "  Failed to close #$issue"
        else
            echo "  Keeping #$issue (parent #$parent is $parent_state)"
        fi
    else
        echo "  No parent found for #$issue, skipping"
    fi
done

echo "✅ Bulk cleanup completed"