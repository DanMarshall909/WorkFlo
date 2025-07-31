#!/usr/bin/env bats
# Simple tests for board command that don't require GitHub API

@test "board_create_without_parameters_shows_usage_error" {
    # Given: No command line parameters provided
    # When: Running board create without any parameters
    run timeout 2s ./board create
    
    # Then: Should fail immediately and show usage instructions
    [ "$status" -ne 0 ]
    [[ "$output" == *"Usage:"* ]] || [[ "$output" == *"--title"* ]]
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