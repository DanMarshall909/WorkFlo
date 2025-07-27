#!/usr/bin/env bats
# Test suite for 'flo feature' command - TDD RED phase

@test "flo feature command exists and works" {
    # This test MUST fail during RED phase - flo feature subcommand doesn't exist yet
    run ./flo feature 123
    [ "$status" -eq 0 ]
}

@test "flo feature automates complete TDD workflow" {
    # This test will fail until we implement the flo feature command
    run ./flo feature 999
    [ "$status" -eq 0 ]
    [[ "$output" == *"TDD workflow"* ]]
}

@test "flo feature creates branches and runs TDD phases" {
    # This test will fail until implementation
    run ./flo feature 123
    [ "$status" -eq 0 ]
    [[ "$output" == *"feature/issue-123"* ]]
}

@test "flo feature handles errors and reopens subissues" {
    # This test will fail until implementation
    export SIMULATE_ERROR=true
    run ./flo feature 456
    [ "$status" -eq 0 ]
    [[ "$output" == *"Reopening subissue"* ]]
}

@test "flo feature creates and merges PRs at 90% confidence" {
    # This test will fail until implementation
    run ./flo feature 789
    [ "$status" -eq 0 ]
    [[ "$output" == *"PR created"* ]]
    [[ "$output" == *"90% confident"* ]]
}