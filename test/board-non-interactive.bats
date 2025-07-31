#!/usr/bin/env bats
# Tests for board create command non-interactivity

setup() {
    # Backup any existing temp files
    export TEMP_DIR=$(mktemp -d)
    export TEST_ISSUE_TITLE="Test Non-Interactive Issue"
    export TEST_CRITERIA="Criterion 1;Criterion 2;Criterion 3"
    export TEST_DESCRIPTION="Test description for non-interactive issue"
}

teardown() {
    # Clean up any test issues created
    if [[ -n "$CREATED_ISSUE" ]]; then
        gh issue close "$CREATED_ISSUE" --delete-branch 2>/dev/null || true
    fi
    rm -rf "$TEMP_DIR" 2>/dev/null || true
}

@test "board_create_with_command_line_parameters_creates_issue_without_interaction" {
    # Given: Command line parameters for issue creation
    # When: Creating issue with --title, --criteria, and --description flags
    run ./board create --title "$TEST_ISSUE_TITLE" --criteria "$TEST_CRITERIA" --description "$TEST_DESCRIPTION"
    
    # Then: Should create issue successfully without any interactive prompts
    [ "$status" -eq 0 ]
    [[ "$output" == *"Created issue"* ]]
    [[ "$output" == *"$TEST_ISSUE_TITLE"* ]]
    
    # Extract issue number for cleanup
    CREATED_ISSUE=$(echo "$output" | grep -o 'issue #[0-9]*' | grep -o '[0-9]*')
    
    # Verify issue has correct acceptance criteria format
    if [[ -n "$CREATED_ISSUE" ]]; then
        issue_body=$(gh issue view "$CREATED_ISSUE" --json body | jq -r '.body')
        [[ "$issue_body" == *"- [ ] Criterion 1"* ]]
        [[ "$issue_body" == *"- [ ] Criterion 2"* ]]
        [[ "$issue_body" == *"- [ ] Criterion 3"* ]]
    fi
}

@test "board_create_without_parameters_fails_immediately_without_interactive_prompts" {
    # Given: No command line parameters provided
    # When: Running board create without any parameters in non-interactive environment
    run timeout 2s sh -c 'echo "" | ./board create'
    
    # Then: Should fail immediately without showing interactive prompts
    [ "$status" -ne 0 ]
    # Should show usage error instead
    [[ "$output" == *"Usage:"* ]] || [[ "$output" == *"--title"* ]]
}