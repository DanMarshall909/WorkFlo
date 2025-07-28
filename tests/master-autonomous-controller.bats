#!/usr/bin/env bats
# Tests for Phase 3: Master Autonomous Controller
# Business scenario: Complete automation engine that orchestrates the entire TDD workflow

# Test: Master controller orchestrates full TDD workflow from issue to completion
@test "master_controller_orchestrates_full_tdd_workflow_from_issue_to_completion" {
    # Given: A GitHub issue with acceptance criteria
    local issue_number="35"
    local workflow_config='{
        "issue": 35,
        "phases": ["test_generation", "llm_integration", "automation_engine"],
        "auto_commit": true,
        "auto_advance": true
    }'
    
    # When: The master autonomous controller processes the issue
    run ./lib/autonomous-test-generator.sh master-control-workflow "$workflow_config"
    
    # Then: It should orchestrate the complete workflow
    [ "$status" -eq 0 ]
    [[ "$output" =~ "workflow_orchestrated" ]]
    [[ "$output" =~ "tdd_cycle_automated" ]]
    [[ "$output" =~ "phases_completed" ]]
    [[ "$output" =~ "automation_engine" ]]
}

# Test: Automation engine automatically advances through TDD phases without manual intervention
@test "automation_engine_automatically_advances_through_tdd_phases_without_manual_intervention" {
    # Given: A TDD session in progress with failing tests
    local tdd_state='{
        "issue": 35,
        "criteria": 3,
        "phase": "RED",
        "failing_tests": ["test_automation_engine"],
        "auto_advance": true
    }'
    
    # When: The automation engine processes the TDD state
    run ./lib/autonomous-test-generator.sh automation-engine-advance "$tdd_state"
    
    # Then: It should automatically advance through phases
    [ "$status" -eq 0 ]
    [[ "$output" =~ "auto_advance_enabled" ]]
    [[ "$output" =~ "phase_transition" ]]
    [[ "$output" =~ "RED_to_GREEN" ]]
    [[ "$output" =~ "automation_complete" ]]
}

# Test: Complete automation engine integrates test generation and LLM implementation
@test "complete_automation_engine_integrates_test_generation_and_llm_implementation" {
    # Given: An acceptance criteria requiring both test generation and implementation
    local criteria_spec='{
        "criteria": "Phase 3: Master Autonomous Controller - Complete automation engine",
        "requires_tests": true,
        "requires_implementation": true,
        "integration_mode": "full_automation"
    }'
    
    # When: The complete automation engine processes the criteria
    run ./lib/autonomous-test-generator.sh complete-automation-engine "$criteria_spec"
    
    # Then: It should integrate both test generation and LLM implementation
    [ "$status" -eq 0 ]
    [[ "$output" =~ "test_generation_integrated" ]]
    [[ "$output" =~ "llm_implementation_integrated" ]]
    [[ "$output" =~ "full_automation" ]]
    [[ "$output" =~ "master_controller" ]]
}

# Test: Master controller handles workflow state management and progress tracking
@test "master_controller_handles_workflow_state_management_and_progress_tracking" {
    # Given: A complex workflow with multiple phases and state transitions
    local workflow_state='{
        "current_phase": "automation_engine",
        "completed_phases": ["test_generation", "llm_integration"],
        "remaining_phases": ["complete_automation"],
        "progress": "75%"
    }'
    
    # When: The master controller manages the workflow state
    run ./lib/autonomous-test-generator.sh master-state-management "$workflow_state"
    
    # Then: It should handle state management and progress tracking
    [ "$status" -eq 0 ]
    [[ "$output" =~ "state_managed" ]]
    [[ "$output" =~ "progress_tracked" ]]
    [[ "$output" =~ "workflow_coordination" ]]
    [[ "$output" =~ "phase_management" ]]
}