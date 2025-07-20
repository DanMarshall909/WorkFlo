#!/bin/bash

# start-subissue-work.sh - Start work on a specific subissue with GitHub integration
# Usage: ./scripts/start-subissue-work.sh <issue-number> <subissue-number>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
    echo -e "${BLUE}[SUBISSUE-WORK]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if gh CLI is authenticated
check_auth() {
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI not authenticated. Run 'gh auth login' first."
    fi
}

# Create GitHub subissue with proper linking
create_github_subissue() {
    local parent_issue="$1"
    local subissue_number="$2"
    local test_description="$3"
    local feature_description="$4"
    
    log "Creating GitHub subissue for test $subissue_number..."
    
    # Create subissue title
    local subissue_title="Test $subissue_number: $test_description"
    
    # Create subissue body with proper linking
    local subissue_body
    subissue_body=$(cat <<EOF
## 🔗 Parent Feature
**Issue**: #$parent_issue  
**Feature**: $feature_description

## 🧪 Test Specification
**Test Description**: $test_description  
**Test Type**: Unit Test  
**Subissue Number**: $subissue_number

## 📋 Test Implementation Checklist
- [ ] **RED Phase**: Write failing test
- [ ] **GREEN Phase**: Implement minimal solution
- [ ] **REFACTOR Phase**: Improve code quality (if needed)
- [ ] **Coverage Validation**: Ensure test coverage is maintained
- [ ] **Quality Analysis**: Run automated quality checks

## 🔄 TDD Workflow
This subissue follows the strict TDD workflow:
1. Write ONE failing test (RED)
2. Write minimal implementation to pass (GREEN)  
3. Refactor if needed (REFACTOR)
4. Validate coverage and quality

## ✅ Definition of Done
- [ ] Test passes consistently
- [ ] Code coverage maintained at 95%+
- [ ] No quality issues introduced
- [ ] Ready to merge to feature branch

## 🏗️ Branch Structure
**Test Branch**: \`test/$parent_issue-$subissue_number-...\`  
**Feature Branch**: \`feature/$parent_issue-...\`  
**Merge Flow**: test → feature → master

---
🤖 Auto-generated subissue for TDD workflow  
Parent: #$parent_issue
EOF
)
    
    # Create the subissue
    local subissue_id
    subissue_id=$(gh issue create \
        --title "$subissue_title" \
        --body "$subissue_body" \
        --label "subissue,testing,tdd" \
        --json number \
        --jq '.number')
    
    if [[ -n "$subissue_id" ]]; then
        success "Created subissue #$subissue_id: $subissue_title"
        
        # Link subissue to parent issue
        gh issue comment "$parent_issue" --body "🔗 Created subissue #$subissue_id: $test_description"
        
        # Add to project board
        if [[ -f "$SCRIPT_DIR/gh-board-sync.sh" ]]; then
            log "Adding subissue to project board..."
            "$SCRIPT_DIR/gh-board-sync.sh" add "$subissue_id" >/dev/null 2>&1 || warn "Failed to add to project board"
            "$SCRIPT_DIR/gh-board-sync.sh" start "$subissue_id" >/dev/null 2>&1 || warn "Failed to start subissue on board"
        fi
        
        echo "$subissue_id"
    else
        error "Failed to create subissue"
    fi
}

# Update test description with GitHub links
update_test_description() {
    local parent_issue="$1"
    local subissue_number="$2"
    local subissue_id="$3"
    local test_description="$4"
    local feature_description="$5"
    
    log "Updating test description with GitHub links..."
    
    # Find the test file or create template
    local test_file_pattern="*Tests.cs"
    local test_files
    test_files=$(find tests/ -name "$test_file_pattern" -type f 2>/dev/null | head -1)
    
    if [[ -z "$test_files" ]]; then
        warn "No test file found - description will be available for manual addition"
        return 0
    fi
    
    # Create test method template with GitHub links
    local test_method_template
    test_method_template=$(cat <<EOF

    /// <summary>
    /// GitHub Subissue: https://github.com/\$(gh repo view --json owner,name --jq '.owner.login + \"/\" + .name')/issues/$subissue_id
    /// Feature: $feature_description
    /// </summary>
    [Fact]
    public void ${test_description// /_}()
    {
        // 🔗 Subissue: #$subissue_id
        // 📋 Feature: #$parent_issue - $feature_description
        
        // TODO: Implement test following TDD workflow
        // 1. RED: Write failing assertion
        // 2. GREEN: Implement minimal solution
        // 3. REFACTOR: Improve if needed
        
        true.Should().BeFalse("Test not yet implemented - follow TDD workflow");
    }
EOF
)
    
    # Save template for manual addition
    local template_file=".workflo/test-templates/subissue-$subissue_id-template.cs"
    mkdir -p .workflo/test-templates
    echo "$test_method_template" > "$template_file"
    
    log "Test template saved to: $template_file"
    success "Updated test description with GitHub links"
}

# Switch to subissue branch using tracking data
switch_to_subissue_branch() {
    local parent_issue="$1"
    local subissue_number="$2"
    
    # Try to get branch name from tracking file
    local tracking_file=".workflo/branch-tracking.json"
    local subissue_branch=""
    
    if [[ -f "$tracking_file" ]]; then
        # Get short name from tracking data
        local short_name
        short_name=$(jq -r --arg issue "$parent_issue" --arg num "$subissue_number" \
            '.[$issue].subissues | map(select(.type | contains($num))) | .[0].short_name // empty' \
            "$tracking_file" 2>/dev/null || echo "")
        
        if [[ -n "$short_name" ]]; then
            subissue_branch="test/$parent_issue-$subissue_number-$short_name"
        fi
    fi
    
    # Fallback to pattern matching if tracking file doesn't have the info
    if [[ -z "$subissue_branch" ]]; then
        subissue_branch=$(git branch -a | grep -E "test/$parent_issue-$subissue_number-" | head -1 | sed 's/.*\///g' | xargs)
    fi
    
    if [[ -z "$subissue_branch" ]]; then
        error "Subissue branch test/$parent_issue-$subissue_number-* not found. Run create-feature-branches.sh first."
    fi
    
    log "Switching to subissue branch: $subissue_branch"
    git checkout "$subissue_branch"
    
    success "Now working on: $subissue_branch"
}

# Update progress tracking
update_progress_tracking() {
    local parent_issue="$1"
    local subissue_number="$2"
    local subissue_id="$3"
    local test_description="$4"
    
    # Update PROGRESS.md
    cat > PROGRESS.md <<EOF
# Current Work Progress

## 🎯 Active Subissue
**Subissue**: #$subissue_id - Test $subissue_number: $test_description  
**Parent Issue**: #$parent_issue  
**Branch**: $(git branch --show-current)  
**Started**: $(date)

## 📋 TDD Phase Checklist
- [ ] RED: Write failing test
- [ ] GREEN: Implement minimal solution  
- [ ] REFACTOR: Improve code quality
- [ ] COVER: Validate coverage
- [ ] COMMIT: Complete subissue

## 🔗 GitHub Links
- **Subissue**: https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues/$subissue_id
- **Parent Issue**: https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues/$parent_issue

## 🚀 Next Steps
1. Run: \`./scripts/tdd-enhanced-cycle.sh RED "test-description"\`
2. Follow TDD workflow phases
3. Complete subissue with: \`./scripts/complete-subissue.sh $parent_issue $subissue_number\`

Last Updated: $(date)
EOF
    
    log "Updated PROGRESS.md with current subissue work"
}

# Show help
show_help() {
    echo "Subissue Work Manager with GitHub Integration"
    echo ""
    echo "Usage: $0 <issue-number> <subissue-number>"
    echo ""
    echo "Starts work on a specific subissue by:"
    echo "  1. Creating GitHub subissue with proper linking"
    echo "  2. Updating test descriptions with GitHub links"
    echo "  3. Switching to the appropriate test branch"
    echo "  4. Setting up progress tracking"
    echo ""
    echo "Arguments:"
    echo "  issue-number     Parent GitHub issue number"
    echo "  subissue-number  Subissue sequence number (1, 2, 3, etc.)"
    echo ""
    echo "Examples:"
    echo "  $0 123 1         # Start work on first subissue of issue #123"
    echo "  $0 124 3         # Start work on third subissue of issue #124"
    echo ""
    echo "Requirements:"
    echo "  - Feature branches must exist (run create-feature-branches.sh first)"
    echo "  - GitHub CLI authenticated"
    echo "  - Must be run from repository root"
    echo ""
    echo "Creates:"
    echo "  - GitHub subissue with parent linking"
    echo "  - Test template with GitHub links"
    echo "  - Progress tracking in PROGRESS.md"
    echo "  - Project board updates"
}

# Main execution
if [[ $# -ne 2 ]]; then
    show_help
    exit 1
fi

# Check dependencies
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) is required but not installed"
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
    error "Must be run from within a git repository"
fi

PARENT_ISSUE="$1"
SUBISSUE_NUMBER="$2"

# Validate inputs
if ! [[ "$PARENT_ISSUE" =~ ^[0-9]+$ ]]; then
    error "Issue number must be a positive integer"
fi

if ! [[ "$SUBISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    error "Subissue number must be a positive integer"
fi

# Check authentication
check_auth

# Get parent issue details
log "Processing parent issue #$PARENT_ISSUE..."
PARENT_TITLE=$(gh issue view "$PARENT_ISSUE" --json title --jq '.title' 2>/dev/null || echo "")
if [[ -z "$PARENT_TITLE" ]]; then
    error "Parent issue #$PARENT_ISSUE not found or inaccessible"
fi

# Extract test description for this subissue
log "Extracting test specification for subissue $SUBISSUE_NUMBER..."
TEST_DESCRIPTION="Implementation for subissue $SUBISSUE_NUMBER"  # Default fallback

# Get test description from issue body if available
ISSUE_BODY=$(gh issue view "$PARENT_ISSUE" --json body --jq '.body' 2>/dev/null || echo "")
if [[ -n "$ISSUE_BODY" ]]; then
    # Try to extract specific test description
    TEST_MATCH=$(echo "$ISSUE_BODY" | grep -E "^\s*-\s*\[\s*\]\s*\*\*Test\s+$SUBISSUE_NUMBER\*\*:\s*(.+)$" | head -1 || echo "")
    if [[ -n "$TEST_MATCH" ]]; then
        TEST_DESCRIPTION=$(echo "$TEST_MATCH" | sed -E 's/^\s*-\s*\[\s*\]\s*\*\*Test\s+[0-9]+\*\*:\s*(.+)$/\1/')
    fi
fi

log "Test description: $TEST_DESCRIPTION"
log "Feature description: $PARENT_TITLE"

# Create GitHub subissue
SUBISSUE_ID=$(create_github_subissue "$PARENT_ISSUE" "$SUBISSUE_NUMBER" "$TEST_DESCRIPTION" "$PARENT_TITLE")

# Update test description with GitHub links
update_test_description "$PARENT_ISSUE" "$SUBISSUE_NUMBER" "$SUBISSUE_ID" "$TEST_DESCRIPTION" "$PARENT_TITLE"

# Switch to subissue branch
switch_to_subissue_branch "$PARENT_ISSUE" "$SUBISSUE_NUMBER"

# Update progress tracking
update_progress_tracking "$PARENT_ISSUE" "$SUBISSUE_NUMBER" "$SUBISSUE_ID" "$TEST_DESCRIPTION"

echo ""
success "🎉 Subissue work started successfully!"
echo ""
echo "📋 Current Setup:"
echo "  Parent Issue: #$PARENT_ISSUE - $PARENT_TITLE"
echo "  Subissue: #$SUBISSUE_ID - Test $SUBISSUE_NUMBER: $TEST_DESCRIPTION"
echo "  Branch: $(git branch --show-current)"
echo ""
echo "🚀 Next Steps:"
echo "  1. Start TDD cycle: ./scripts/tdd-enhanced-cycle.sh RED \"$TEST_DESCRIPTION\""
echo "  2. Follow RED → GREEN → REFACTOR → COVER workflow"
echo "  3. Complete subissue: ./scripts/complete-subissue.sh $PARENT_ISSUE $SUBISSUE_NUMBER"
echo ""
echo "🔗 GitHub Links:"
echo "  Subissue: https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues/$SUBISSUE_ID"
echo "  Parent: https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues/$PARENT_ISSUE"
echo ""