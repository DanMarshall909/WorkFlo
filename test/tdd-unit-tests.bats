#!/usr/bin/env bats
# Unit tests for TDD script functions

setup() {
    # Source the TDD script to access functions
    export CONFIG_FILE=".workflo-config"
    export STATE_FILE=".tdd-state"
    
    # Load configuration defaults
    export CONFIDENCE_WEIGHTS_TEST_PASS=30
    export CONFIDENCE_WEIGHTS_COVERAGE=25
    export CONFIDENCE_WEIGHTS_REVIEW=25
    export CONFIDENCE_WEIGHTS_MUTATION=20
    export CONFIDENCE_THRESHOLD=90
    export QUALITY_BASE_SCORE=85
    
    # Source functions from tdd script
    source ./tdd
}

@test "calculate_weighted_confidence_score_returns_correct_percentage" {
    # Given: Test metrics
    local test_rate=100 coverage=95 review=88 mutation=85
    
    # When: Calculating weighted confidence score
    result=$(calculate_weighted_confidence_score "$test_rate" "$coverage" "$review" "$mutation")
    
    # Then: Should return correct weighted average
    [ "$result" -eq 92 ]
}

@test "calculate_weighted_confidence_score_handles_zero_values" {
    # Given: Zero values for some metrics
    local test_rate=0 coverage=0 review=0 mutation=0
    
    # When: Calculating weighted confidence score
    result=$(calculate_weighted_confidence_score "$test_rate" "$coverage" "$review" "$mutation")
    
    # Then: Should return 0
    [ "$result" -eq 0 ]
}

@test "calculate_weighted_confidence_score_handles_perfect_scores" {
    # Given: Perfect scores
    local test_rate=100 coverage=100 review=100 mutation=100
    
    # When: Calculating weighted confidence score
    result=$(calculate_weighted_confidence_score "$test_rate" "$coverage" "$review" "$mutation")
    
    # Then: Should return 100
    [ "$result" -eq 100 ]
}

@test "perform_heuristic_analysis_gives_base_score_for_simple_changes" {
    # Given: Simple changes with no special patterns
    local changes="+ simple change"
    local line_count=5
    
    # When: Performing heuristic analysis
    result=$(perform_heuristic_analysis "$changes" "$line_count")
    
    # Then: Should return base score with small change bonus
    expected=$((QUALITY_BASE_SCORE + 5))  # Small change bonus
    [ "$result" -eq "$expected" ]
}

@test "perform_heuristic_analysis_adds_test_bonus" {
    # Given: Changes that include tests
    local changes="+ test('should work', () => {})"
    local line_count=10
    
    # When: Performing heuristic analysis
    result=$(perform_heuristic_analysis "$changes" "$line_count")
    
    # Then: Should include test bonus and small change bonus
    expected=$((QUALITY_BASE_SCORE + 5 + 5))  # Test bonus + small change bonus
    [ "$result" -eq "$expected" ]
}

@test "perform_heuristic_analysis_applies_todo_penalty" {
    # Given: Changes with TODO comments
    local changes="+ // TODO: fix this later"
    local line_count=5
    
    # When: Performing heuristic analysis
    result=$(perform_heuristic_analysis "$changes" "$line_count")
    
    # Then: Should apply TODO penalty but also small change bonus
    expected=$((QUALITY_BASE_SCORE - 10 + 5))  # TODO penalty + small change bonus
    [ "$result" -eq "$expected" ]
}

@test "perform_heuristic_analysis_applies_large_change_penalty" {
    # Given: Large changes
    local changes=$(printf "%.0s+ line\n" {1..150})  # 150 lines
    local line_count=150
    
    # When: Performing heuristic analysis
    result=$(perform_heuristic_analysis "$changes" "$line_count")
    
    # Then: Should apply large change penalty
    expected=$((QUALITY_BASE_SCORE - 15))  # Large change penalty
    [ "$result" -eq "$expected" ]
}

@test "perform_heuristic_analysis_ensures_bounds" {
    # Given: Changes that would result in negative score
    local changes="+ TODO: fix\n+ FIXME: broken\n+ HACK: temp"
    local line_count=200  # Large change
    
    # When: Performing heuristic analysis
    result=$(perform_heuristic_analysis "$changes" "$line_count")
    
    # Then: Should not go below 0
    [ "$result" -ge 0 ]
    [ "$result" -le 100 ]
}

@test "validate_issue_param_fails_with_empty_issue" {
    # Given: Empty issue parameter
    # When: Validating issue parameter
    # Then: Should exit with error
    run validate_issue_param "" "test"
    [ "$status" -ne 0 ]
}

@test "validate_issue_param_succeeds_with_valid_issue" {
    # Given: Valid issue parameter
    # When: Validating issue parameter
    # Then: Should succeed
    run validate_issue_param "123" "test"
    [ "$status" -eq 0 ]
}

@test "cover_phase_adds_comprehensive_test_coverage_and_validates_mutation_testing" {
    # Given: A repository with initial minimal tests
    local initial_test_count=$(find . -name "*.test.*" -o -name "*.spec.*" -o -name "*.bats" 2>/dev/null | wc -l || echo 0)
    
    # When: COVER phase is executed (simulated)
    # This test should FAIL initially because COVER phase doesn't actually add comprehensive tests
    local comprehensive_coverage_added=false  # This should be true after fix
    local mutation_testing_run=false          # This should be true after fix
    
    # Then: Should add comprehensive test coverage beyond initial minimal tests
    [ "$comprehensive_coverage_added" = true ]
    [ "$mutation_testing_run" = true ]
}