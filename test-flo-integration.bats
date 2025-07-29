#!/usr/bin/env bats
# Integration test suite for WorkFlo commands that require full environment
# These tests need GitHub auth, real API access, and full system setup
# NOT run in CI - use for local integration testing only

@test "ai_powered_code_review_analyzes_changes_and_provides_quality_assessment" {
    # Given: Code changes have been made in a TDD cycle
    # When: AI code review is triggered
    # Then: Quality assessment and review comments should be generated
    
    # This test requires GitHub auth and real repository access
    export MOCK_ISSUE=999
    run ./tdd review $MOCK_ISSUE
    [ "$status" -eq 0 ]
    [[ "$output" == *"Running AI code review"* ]]
    [[ "$output" == *"Quality Score"* ]]
    [[ "$output" == *"Code Quality Analysis"* ]]
}

@test "board_create_command_runs_without_interactive_prompts" {
    # Given: A command line environment without interactive capabilities
    # When: Board create command is executed
    # Then: Command should complete without requiring user input
    
    # This test requires GitHub auth to create real issues
    run ./board create --non-interactive
    [ "$status" -eq 0 ]
    [[ "$output" == *"SUCCESS"* ]]
    [[ "$output" != *"Enter"* ]]
    [[ "$output" != *"Please provide"* ]]
}

@test "board_operations_accept_command_line_parameters_for_all_functions" {
    # Given: All board operations (list, update, status) should work via command line
    # When: Board operations are called with appropriate parameters
    # Then: Commands should execute without requiring interactive input
    
    # This test requires GitHub auth to update real issues
    run ./board update 123 --status "In Progress"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Updated issue #123"* ]]
}

@test "tdd_workflow_commands_execute_without_requiring_user_input" {
    # Given: TDD workflow commands that may have interactive prompts
    # When: TDD commands are executed in non-interactive mode
    # Then: Commands should complete without waiting for user input
    
    # This test requires GitHub auth to validate issue existence
    run ./tdd start 999 --non-interactive
    # Command may fail due to missing issue, but should show it's trying to start workflow
    [[ "$output" == *"Starting TDD workflow"* ]]
    [[ "$output" != *"read"* ]]
    [[ "$output" != *"Enter"* ]]
    [[ "$output" != *"continue"* ]]
}

@test "real_github_pr_creation_replaces_mock_output_with_actual_api_calls" {
    # Given: A completed TDD workflow ready for PR creation
    # When: PR creation is triggered
    # Then: Real GitHub PR should be created via API
    
    # This test requires GitHub auth and real repository access
    skip "Requires authenticated GitHub environment and real repo"
    
    export MOCK_ISSUE=999
    run ./flo feature $MOCK_ISSUE
    [ "$status" -eq 0 ]
    [[ "$output" == *"https://github.com/"* ]]
    [[ "$output" == *"Pull request created:"* ]]
    [[ "$output" == *"End-to-end PR creation test"* ]]
    [[ "$output" == *"Real GitHub integration validated"* ]]
}