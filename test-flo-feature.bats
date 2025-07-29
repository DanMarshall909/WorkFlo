#!/usr/bin/env bats
# Test suite for WorkFlo 'flo feature' command and core functionality

@test "flo_feature_command_exists_and_shows_help" {
    # Given: The flo command system
    # When: flo feature help is requested
    # Then: Should show feature command information
    
    run ./flo help
    [ "$status" -eq 0 ]
    [[ "$output" == *"feature"* ]]
}

@test "flo_feature_command_handles_basic_invocation" {
    # Given: A mock issue for testing
    # When: flo feature is called with an issue number
    # Then: Should execute without error and show expected output
    
    export MOCK_ISSUE=123
    run ./flo feature $MOCK_ISSUE
    [ "$status" -eq 0 ]
    [[ "$output" == *"TDD workflow"* ]]
    [[ "$output" == *"90% confident"* ]]
}

@test "confidence_scoring_system_calculates_basic_scores" {
    # Given: A confidence scoring system
    # When: Basic scoring is calculated
    # Then: Should return reasonable confidence percentages
    
    # Test that the flo feature command produces confidence scoring output
    export MOCK_ISSUE=456
    run ./flo feature $MOCK_ISSUE
    [ "$status" -eq 0 ]
    [[ "$output" == *"90%"* || "$output" == *"confident"* ]]
}

@test "flo_commands_provide_consistent_help_output" {
    # Given: The flo command system
    # When: Help is requested for different commands
    # Then: Should provide consistent help formatting
    
    run ./flo help
    [ "$status" -eq 0 ]
    [[ "$output" == *"Usage:"* ]]
    [[ "$output" == *"Commands:"* ]]
}

@test "tdd_workflow_commands_basic_functionality" {
    # Given: The TDD workflow system
    # When: TDD status is checked
    # Then: Should provide appropriate status information
    
    run ./flo status
    [ "$status" -eq 0 ]
    # Should either show no active session or current session info
}

@test "board_operations_basic_functionality" {
    # Given: The board management system
    # When: Board help is requested
    # Then: Should show available board operations
    
    run ./board help
    [ "$status" -eq 0 ]
    [[ "$output" == *"list"* ]]
    [[ "$output" == *"show"* ]]
    [[ "$output" == *"create"* ]]
}