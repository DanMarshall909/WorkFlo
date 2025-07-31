#!/usr/bin/env bats
# Tests for flo-cli generate-tests command
# AC-6: Create CLI command for generation: `flo-cli generate-tests`

@test "flo_cli_generate_tests_command_creates_test_files_from_github_issue" {
    # Given: A GitHub issue with acceptance criteria
    local test_output_file="tests/issue-123-test-output.test.ts"
    
    # Clean up any existing test file
    [[ -f "$test_output_file" ]] && rm "$test_output_file"
    
    # When: The flo-cli generate-tests command is executed
    run node flo-cli/dist/cli.js generate-tests --issue 123 --output "$test_output_file"
    
    # Then: The command should succeed
    [ "$status" -eq 0 ]
    
    # And: A test file should be created
    [ -f "$test_output_file" ]
    
    # And: The test file should contain Jest test structure
    run grep -q "describe(" "$test_output_file"
    [ "$status" -eq 0 ]
    
    # And: The test file should contain @group annotations
    run grep -q "@group" "$test_output_file"
    [ "$status" -eq 0 ]
    
    # Clean up
    [[ -f "$test_output_file" ]] && rm "$test_output_file"
}