#!/usr/bin/env bats

# Tests for the 'flo feature' command that automates complete feature development

setup() {
    # Setup test environment
    export TEST_REPO_DIR="/tmp/workflo-test-repo-$$"
    mkdir -p "$TEST_REPO_DIR"
    cd "$TEST_REPO_DIR"
    
    # Initialize git repo
    git init
    git config user.email "test@example.com"
    git config user.name "Test User"
    
    # Copy WorkFlo scripts
    cp -r /home/dan/code/WorkFlo/tdd .
    cp -r /home/dan/code/WorkFlo/board .
    cp -r /home/dan/code/WorkFlo/flo . 2>/dev/null || true
}

teardown() {
    cd /
    rm -rf "$TEST_REPO_DIR"
}

@test "flo_feature_command_exists_and_is_executable" {
    # Given: A WorkFlo repository with flo scripts
    # When: Checking if flo feature command exists
    run test -x "./flo"
    
    # Then: Command should exist and be executable
    [ "$status" -eq 0 ]
}

@test "flo_feature_automates_complete_tdd_workflow_for_issue" {
    # Given: A GitHub issue with acceptance criteria
    export MOCK_ISSUE=999
    
    # When: Running flo feature command
    run ./flo feature $MOCK_ISSUE
    
    # Then: Should automate complete TDD cycle
    [ "$status" -eq 0 ]
    [[ "$output" =~ "Starting automated feature development" ]]
    [[ "$output" =~ "TDD workflow completed" ]]
    [[ "$output" =~ "PR created successfully" ]]
}

@test "flo_feature_creates_branch_and_runs_all_tdd_phases" {
    # Given: An issue ready for development
    export MOCK_ISSUE=123
    
    # When: Running automated feature development
    run ./flo feature $MOCK_ISSUE
    
    # Then: Should create feature branch and complete all TDD phases
    [ "$status" -eq 0 ]
    [[ "$output" =~ "feature/issue-123" ]]
    [[ "$output" =~ "RED phase completed" ]]
    [[ "$output" =~ "GREEN phase completed" ]]
    [[ "$output" =~ "REFACTOR phase completed" ]]
    [[ "$output" =~ "COVER phase completed" ]]
}

@test "flo_feature_handles_errors_and_reopens_subissues_when_needed" {
    # Given: A feature development that encounters errors
    export MOCK_ISSUE=456
    export SIMULATE_ERROR=true
    
    # When: Running flo feature with error conditions
    run ./flo feature $MOCK_ISSUE
    
    # Then: Should handle errors gracefully and reopen relevant subissues
    [[ "$output" =~ "Error detected in TDD cycle" ]]
    [[ "$output" =~ "Reopening subissue" ]]
    [[ "$output" =~ "Returning to TDD cycle" ]]
}