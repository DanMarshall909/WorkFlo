#!/usr/bin/env bats
# Tests for Phase 2: Minimal LLM Integration
# Business scenario: Implementation-only LLM calls for autonomous TDD agent

# Test: LLM integration provides implementation suggestions from test specifications
@test "llm_integration_provides_implementation_suggestions_from_test_specifications" {
    # Given: A test specification for a feature
    local test_spec='{
        "name": "user_authentication",
        "test_file": "tests/user-auth.bats",
        "failing_test": "user_can_login_with_valid_credentials",
        "description": "User authentication system with login validation"
    }'
    
    # When: The LLM integration generates implementation suggestions
    run ./lib/autonomous-test-generator.sh llm-suggest-implementation "$test_spec"
    
    # Then: It should return implementation code suggestions
    [ "$status" -eq 0 ]
    [[ "$output" =~ "function" ]]
    [[ "$output" =~ "validate_credentials" ]]
    [[ "$output" =~ "implementation suggestion" ]]
}

# Test: Minimal LLM calls avoid complex reasoning and focus on implementation only
@test "minimal_llm_calls_avoid_complex_reasoning_and_focus_on_implementation_only" {
    # Given: A simple failing test that needs implementation
    local failing_test_info='{
        "test_name": "calculator_adds_two_numbers",
        "test_file": "tests/calculator.bats",
        "expected_function": "add_numbers",
        "description": "Simple addition function"
    }'
    
    # When: The minimal LLM integration processes the request
    run ./lib/autonomous-test-generator.sh llm-minimal-implementation "$failing_test_info"
    
    # Then: It should provide focused implementation without complex reasoning
    [ "$status" -eq 0 ]
    [[ "$output" =~ "add_numbers" ]]
    [[ "$output" =~ "minimal_implementation" ]]
    # And: Should NOT contain complex analysis or reasoning
    [[ ! "$output" =~ "analyze" ]]
    [[ ! "$output" =~ "consider" ]]
    [[ ! "$output" =~ "strategy" ]]
}

# Test: LLM integration extracts implementation requirements from failing tests
@test "llm_integration_extracts_implementation_requirements_from_failing_tests" {
    # Given: A failing test with specific expectations
    local test_output="autonomous_test_generator_parses_acceptance_criteria_and_generates_test_specs FAILED
Expected: test_spec_parser function
Expected: auto_test_generation function
Expected: criteria parsing logic"
    
    # When: The LLM integration analyzes the failing test
    run ./lib/autonomous-test-generator.sh llm-extract-requirements "$test_output"
    
    # Then: It should identify specific implementation requirements
    [ "$status" -eq 0 ]
    [[ "$output" =~ "test_spec_parser" ]]
    [[ "$output" =~ "auto_test_generation" ]]
    [[ "$output" =~ "criteria_parsing" ]]
    [[ "$output" =~ "requirements" ]]
}