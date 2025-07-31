#!/usr/bin/env bats
# Simple tests for board command that don't require GitHub API

@test "board_create_without_parameters_fails_immediately_without_interactive_prompts" {
    # Given: No command line parameters provided
    # When: Running board create without any parameters in CI environment
    run timeout 2s ./board create
    
    # Then: Should fail immediately without any interactive prompts
    [ "$status" -ne 0 ]
    # In CI, it fails at GitHub auth check, which is perfect - no interactive prompts
    [[ "$output" == *"GitHub CLI not authenticated"* ]] || [[ "$output" == *"Usage:"* ]] || [[ "$output" == *"--title"* ]]
}

@test "board_help_command_works" {
    # Given: Help command
    # When: Running board help
    run ./board help
    
    # Then: Should show help information
    [ "$status" -eq 0 ]
    [[ "$output" == *"Usage:"* ]]
    [[ "$output" == *"create"* ]]
}