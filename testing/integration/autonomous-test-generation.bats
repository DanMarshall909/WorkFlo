#!/usr/bin/env bats
# Tests for Phase 1: Autonomous Test Generation
# Business scenario: Build test spec parser and auto-test generation

# Test: Autonomous test generator parses acceptance criteria and generates test specifications
@test "autonomous_test_generator_parses_acceptance_criteria_and_generates_test_specs" {
    # Given: A GitHub issue with acceptance criteria
    local test_issue_body="## Acceptance Criteria

- [ ] Phase 1: Autonomous Test Generation - Build test spec parser and auto-test generation
- [ ] Phase 2: Minimal LLM Integration - Implementation-only LLM calls
- [ ] Phase 3: Master Autonomous Controller - Complete automation engine"

    # When: The test spec parser processes the issue
    run ./lib/autonomous-test-generator.sh parse-criteria "$test_issue_body"
    
    # Then: It should generate structured test specifications
    [ "$status" -eq 0 ]
    [[ "$output" =~ "test_spec_1" ]]
    [[ "$output" =~ "autonomous_test_generation" ]]
    [[ "$output" =~ "test_spec_parser" ]]
    [[ "$output" =~ "auto_test_generation" ]]
}

# Test: Auto-test generation creates BATS test files from specifications
@test "auto_test_generation_creates_bats_test_files_from_specifications" {
    # Given: A test specification for autonomous test generation
    local test_spec='{
        "name": "autonomous_test_generation",
        "description": "Build test spec parser and auto-test generation",
        "scenario": "Developer needs automated test generation from acceptance criteria",
        "given": "A GitHub issue with acceptance criteria",
        "when": "The autonomous test generator processes the issue",
        "then": "It generates appropriate BATS test files with Given-When-Then structure"
    }'
    
    # When: The auto-test generator creates test files
    run ./lib/autonomous-test-generator.sh generate-tests "$test_spec"
    
    # Then: It should create a valid BATS test file
    [ "$status" -eq 0 ]
    [ -f "tests/generated-autonomous-test-generation.bats" ]
    
    # And: The test file should contain proper BATS syntax
    run grep -q "@test" "tests/generated-autonomous-test-generation.bats"
    [ "$status" -eq 0 ]
    
    # And: The test should have Given-When-Then comments
    run grep -q "# Given:" "tests/generated-autonomous-test-generation.bats"
    [ "$status" -eq 0 ]
    run grep -q "# When:" "tests/generated-autonomous-test-generation.bats"  
    [ "$status" -eq 0 ]
    run grep -q "# Then:" "tests/generated-autonomous-test-generation.bats"
    [ "$status" -eq 0 ]
}

# Test: Test spec parser extracts structured data from acceptance criteria
@test "test_spec_parser_extracts_structured_data_from_acceptance_criteria" {
    # Given: An acceptance criteria text
    local criteria_text="Phase 1: Autonomous Test Generation - Build test spec parser and auto-test generation"
    
    # When: The parser extracts structured data
    run ./lib/autonomous-test-generator.sh extract-spec "$criteria_text"
    
    # Then: It should return JSON with test metadata
    [ "$status" -eq 0 ]
    [[ "$output" =~ "\"phase\":" ]]
    [[ "$output" =~ "\"test_name\":" ]]
    [[ "$output" =~ "\"components\":" ]]
    [[ "$output" =~ "test_spec_parser" ]]
    [[ "$output" =~ "auto_test_generation" ]]
}