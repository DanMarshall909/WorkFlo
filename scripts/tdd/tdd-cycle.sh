#!/bin/bash
# tdd-cycle.sh - Enforces Red-Green-Refactor-Cover-Commit TDD cycle
# BLOCKS implementation without failing tests, ensures proper TDD workflow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() { echo -e "${BLUE}🔴🟢🔵 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_red() { echo -e "${RED}🔴 $1${NC}"; }
print_green() { echo -e "${GREEN}🟢 $1${NC}"; }
print_refactor() { echo -e "${PURPLE}🔵 $1${NC}"; }

# TDD State management
TDD_STATE_FILE=".git/tdd-state"
TDD_LOG_FILE=".git/tdd-cycles.log"

# Ensure state directory exists
mkdir -p "$(dirname "$TDD_STATE_FILE")"

print_header "TDD Cycle Enforcer - Red → Green → Refactor → Cover → Commit"
echo ""

# Function to get current timestamp
get_timestamp() {
    date +%s
}

# Function to load TDD state
load_tdd_state() {
    if [[ -f "$TDD_STATE_FILE" ]]; then
        source "$TDD_STATE_FILE"
    else
        # Initialize state
        CURRENT_PHASE="RED"
        CYCLE_COUNT=0
        LAST_TEST_RUN=0
        LAST_BUILD_STATUS=""
        FAILING_TESTS=0
        TOTAL_TESTS=0
        save_tdd_state
    fi
}

# Function to save TDD state
save_tdd_state() {
    cat > "$TDD_STATE_FILE" << EOF
CURRENT_PHASE="$CURRENT_PHASE"
CYCLE_COUNT=$CYCLE_COUNT
LAST_TEST_RUN=$LAST_TEST_RUN
LAST_BUILD_STATUS="$LAST_BUILD_STATUS"
FAILING_TESTS=$FAILING_TESTS
TOTAL_TESTS=$TOTAL_TESTS
EOF
}

# Function to log TDD cycle
log_tdd_cycle() {
    local phase="$1"
    local action="$2"
    echo "$(date +'%Y-%m-%d %H:%M:%S') | Cycle $CYCLE_COUNT | Phase: $phase | Action: $action" >> "$TDD_LOG_FILE"
}

# Function to run tests and analyze results
run_tests_and_analyze() {
    print_info "🧪 Running tests to analyze current state..."
    
    local test_output=$(mktemp)
    local build_success=true
    local test_success=true
    
    # Build first
    if ! dotnet build --verbosity quiet --no-restore > "$test_output" 2>&1; then
        print_error "❌ Build failed"
        cat "$test_output"
        LAST_BUILD_STATUS="FAILED"
        save_tdd_state
        rm "$test_output"
        return 1
    fi
    
    LAST_BUILD_STATUS="SUCCESS"
    
    # Run tests
    if ! dotnet test --no-build --verbosity quiet > "$test_output" 2>&1; then
        test_success=false
    fi
    
    # Count total and failing tests
    TOTAL_TESTS=$(grep -o "Passed: [0-9]*" "$test_output" | head -1 | grep -o "[0-9]*" || echo "0")
    FAILING_TESTS=$(grep -o "Failed: [0-9]*" "$test_output" | head -1 | grep -o "[0-9]*" || echo "0")
    
    if [[ "$FAILING_TESTS" -eq 0 ]] && [[ "$test_success" == true ]]; then
        TOTAL_TESTS=$(grep -o "Total tests: [0-9]*" "$test_output" | grep -o "[0-9]*" || echo "$TOTAL_TESTS")
    fi
    
    LAST_TEST_RUN=$(get_timestamp)
    save_tdd_state
    
    rm "$test_output"
    
    print_info "📊 Test Results: $TOTAL_TESTS total, $FAILING_TESTS failing"
    return $([ "$test_success" == true ] && echo 0 || echo 1)
}

# Function to show current TDD phase status
show_tdd_status() {
    load_tdd_state
    
    print_header "📊 TDD Cycle Status"
    echo ""
    
    case "$CURRENT_PHASE" in
        "RED")
            print_red "🔴 RED PHASE: Write Failing Test"
            echo "  📝 Current task: Write a test that fails"
            echo "  🎯 Goal: Define behavior before implementation"
            echo "  ✅ Success criteria: At least one failing test"
            ;;
        "GREEN")
            print_green "🟢 GREEN PHASE: Make Test Pass"
            echo "  ⚡ Current task: Write minimal code to pass tests"
            echo "  🎯 Goal: Make tests pass with simplest solution"
            echo "  ✅ Success criteria: All tests passing"
            ;;
        "REFACTOR")
            print_refactor "🔵 REFACTOR PHASE: Improve Code Quality"
            echo "  🔧 Current task: Improve code while keeping tests green"
            echo "  🎯 Goal: Enhance readability, remove duplication"
            echo "  ✅ Success criteria: Tests still pass, code improved"
            ;;
        "COVER")
            print_info "📊 COVER PHASE: Ensure Test Coverage"
            echo "  📈 Current task: Verify adequate test coverage"
            echo "  🎯 Goal: >80% coverage, >85% mutation kill rate"
            echo "  ✅ Success criteria: Coverage thresholds met"
            ;;
    esac
    
    echo ""
    print_info "📈 Cycle Statistics:"
    echo "  • Current cycle: $CYCLE_COUNT"
    echo "  • Phase: $CURRENT_PHASE"
    echo "  • Last build: $LAST_BUILD_STATUS"
    echo "  • Tests: $TOTAL_TESTS total, $FAILING_TESTS failing"
    
    if [[ -f "$TDD_LOG_FILE" ]]; then
        echo ""
        print_info "📝 Recent TDD activities:"
        tail -3 "$TDD_LOG_FILE" | while read -r line; do
            echo "    $line"
        done
    fi
}

# Function to start RED phase
start_red_phase() {
    load_tdd_state
    
    print_red "🔴 STARTING RED PHASE"
    echo ""
    print_info "📝 TDD Step 1: Write a Failing Test"
    echo ""
    echo "🎯 RED Phase Guidelines:"
    echo "  • Write the simplest test that could possibly fail"
    echo "  • Focus on the desired behavior, not implementation"
    echo "  • Test should fail for the right reason"
    echo "  • Don't write production code yet!"
    echo ""
    echo "📋 Examples of good failing tests:"
    echo "  • [Fact] public void Should_create_task_with_valid_title()"
    echo "  • [Fact] public void Should_throw_when_title_is_empty()"
    echo "  • [Fact] public void Should_calculate_estimated_duration()"
    echo ""
    
    CURRENT_PHASE="RED"
    ((CYCLE_COUNT++))
    save_tdd_state
    log_tdd_cycle "RED" "Started RED phase - write failing test"
    
    print_warning "⚠️  Remember: Implementation is BLOCKED until test fails!"
    echo ""
    print_info "Next steps:"
    echo "  1. Write your failing test"
    echo "  2. Run: ./scripts/tdd-cycle.sh verify-red"
    echo "  3. Once test fails: ./scripts/tdd-cycle.sh green"
}

# Function to verify RED phase (test should fail)
verify_red_phase() {
    load_tdd_state
    
    if [[ "$CURRENT_PHASE" != "RED" ]]; then
        print_error "❌ Not in RED phase (current: $CURRENT_PHASE)"
        print_info "Use: ./scripts/tdd-cycle.sh status"
        exit 1
    fi
    
    print_red "🔴 VERIFYING RED PHASE"
    echo ""
    
    if ! run_tests_and_analyze; then
        if [[ "$FAILING_TESTS" -gt 0 ]]; then
            print_success "✅ RED PHASE COMPLETE: $FAILING_TESTS test(s) failing"
            echo ""
            print_green "🟢 Ready for GREEN phase"
            echo "Use: ./scripts/tdd-cycle.sh green"
            log_tdd_cycle "RED" "Verified failing tests - ready for GREEN"
        else
            print_error "❌ Build failed but no specific test failures detected"
            print_info "Fix build errors first, then ensure tests fail"
        fi
    else
        print_error "❌ RED PHASE FAILED: All tests are passing!"
        echo ""
        print_warning "🚫 TDD VIOLATION:"
        echo "  • You must write a failing test first"
        echo "  • Tests passing means no new behavior defined"
        echo "  • Write a test that fails for the right reason"
        echo ""
        print_info "Fix by:"
        echo "  1. Write a test for new behavior"
        echo "  2. Ensure the test fails because feature doesn't exist"
        echo "  3. Run: ./scripts/tdd-cycle.sh verify-red"
        exit 1
    fi
}

# Function to start GREEN phase
start_green_phase() {
    load_tdd_state
    
    if [[ "$CURRENT_PHASE" != "RED" ]]; then
        print_error "❌ Can only move to GREEN from RED phase"
        print_info "Current phase: $CURRENT_PHASE"
        exit 1
    fi
    
    # Verify we have failing tests
    if ! run_tests_and_analyze; then
        if [[ "$FAILING_TESTS" -eq 0 ]]; then
            print_error "❌ No failing tests found - cannot start GREEN phase"
            print_info "Go back to RED phase and write failing tests"
            exit 1
        fi
    else
        print_error "❌ All tests passing - cannot start GREEN phase"
        print_info "Need failing tests from RED phase first"
        exit 1
    fi
    
    print_green "🟢 STARTING GREEN PHASE"
    echo ""
    print_info "⚡ TDD Step 2: Make Tests Pass"
    echo ""
    echo "🎯 GREEN Phase Guidelines:"
    echo "  • Write the MINIMAL code to make tests pass"
    echo "  • Don't worry about perfect code - just make it work"
    echo "  • No premature optimization or gold-plating"
    echo "  • Focus on making the red tests green"
    echo ""
    echo "📋 GREEN phase strategies:"
    echo "  • Hard-code return values if needed"
    echo "  • Use fake implementations temporarily"
    echo "  • Add TODO comments for refactoring later"
    echo "  • Make it work, then make it right"
    echo ""
    
    CURRENT_PHASE="GREEN"
    save_tdd_state
    log_tdd_cycle "GREEN" "Started GREEN phase - make tests pass"
    
    print_info "📊 Currently failing: $FAILING_TESTS test(s)"
    echo ""
    print_info "Next steps:"
    echo "  1. Write minimal code to pass failing tests"
    echo "  2. Run: ./scripts/tdd-cycle.sh verify-green"
    echo "  3. Once tests pass: ./scripts/tdd-cycle.sh refactor"
}

# Function to verify GREEN phase (tests should pass)
verify_green_phase() {
    load_tdd_state
    
    if [[ "$CURRENT_PHASE" != "GREEN" ]]; then
        print_error "❌ Not in GREEN phase (current: $CURRENT_PHASE)"
        exit 1
    fi
    
    print_green "🟢 VERIFYING GREEN PHASE"
    echo ""
    
    if run_tests_and_analyze; then
        print_success "✅ GREEN PHASE COMPLETE: All $TOTAL_TESTS tests passing"
        echo ""
        print_refactor "🔵 Ready for REFACTOR phase"
        echo "Use: ./scripts/tdd-cycle.sh refactor"
        log_tdd_cycle "GREEN" "All tests passing - ready for REFACTOR"
    else
        print_error "❌ GREEN PHASE INCOMPLETE: $FAILING_TESTS test(s) still failing"
        echo ""
        print_info "Continue implementing to make all tests pass"
        echo "  • Focus on the failing tests"
        echo "  • Use minimal implementation"
        echo "  • Run: ./scripts/tdd-cycle.sh verify-green when ready"
    fi
}

# Function to start REFACTOR phase
start_refactor_phase() {
    load_tdd_state
    
    if [[ "$CURRENT_PHASE" != "GREEN" ]]; then
        print_error "❌ Can only move to REFACTOR from GREEN phase"
        exit 1
    fi
    
    # Verify all tests are passing
    if ! run_tests_and_analyze; then
        print_error "❌ Tests failing - cannot start REFACTOR phase"
        print_info "Fix failing tests first with GREEN phase"
        exit 1
    fi
    
    print_refactor "🔵 STARTING REFACTOR PHASE"
    echo ""
    print_info "🔧 TDD Step 3: Improve Code Quality"
    echo ""
    echo "🎯 REFACTOR Phase Guidelines:"
    echo "  • Improve code structure without changing behavior"
    echo "  • Remove duplication (DRY principle)"
    echo "  • Improve readability and maintainability"
    echo "  • Run tests frequently to ensure no regressions"
    echo ""
    echo "📋 Refactoring techniques:"
    echo "  • Extract methods/classes"
    echo "  • Rename variables/methods for clarity"
    echo "  • Eliminate magic numbers/strings"
    echo "  • Improve error handling"
    echo "  • Add documentation/comments"
    echo ""
    
    CURRENT_PHASE="REFACTOR"
    save_tdd_state
    log_tdd_cycle "REFACTOR" "Started REFACTOR phase - improve code quality"
    
    print_warning "⚠️  Keep tests GREEN during refactoring!"
    echo ""
    print_info "Next steps:"
    echo "  1. Refactor code while keeping tests green"
    echo "  2. Run tests frequently: dotnet test"
    echo "  3. When satisfied: ./scripts/tdd-cycle.sh cover"
}

# Function to move to COVER phase
start_cover_phase() {
    load_tdd_state
    
    if [[ "$CURRENT_PHASE" != "REFACTOR" ]]; then
        print_error "❌ Can only move to COVER from REFACTOR phase"
        exit 1
    fi
    
    # Verify all tests still pass after refactoring
    if ! run_tests_and_analyze; then
        print_error "❌ Tests failing after refactoring - fix before coverage"
        exit 1
    fi
    
    print_info "📊 STARTING COVER PHASE"
    echo ""
    print_info "📈 TDD Step 4: Verify Test Coverage"
    echo ""
    
    CURRENT_PHASE="COVER"
    save_tdd_state
    log_tdd_cycle "COVER" "Started COVER phase - verify coverage"
    
    # Run coverage analysis
    print_info "🔍 Analyzing test coverage..."
    
    if ! dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage/current --verbosity quiet; then
        print_error "❌ Coverage analysis failed"
        exit 1
    fi
    
    # Find and analyze coverage
    coverage_files=$(find ./coverage/current -name "coverage.cobertura.xml" 2>/dev/null || echo "")
    
    if [[ -n "$coverage_files" ]]; then
        line_coverage=$(grep -o 'line-rate="[0-9.]*"' $coverage_files | head -1 | sed 's/line-rate="//;s/"//')
        
        if [[ -n "$line_coverage" ]]; then
            coverage_percent=$(echo "$line_coverage * 100" | bc -l 2>/dev/null || echo "0")
            coverage_percent=${coverage_percent%.*}
            
            print_info "📊 Coverage Results:"
            echo "  • Line coverage: ${coverage_percent}%"
            
            if [[ "$coverage_percent" -ge 80 ]]; then
                print_success "✅ Coverage target met: ${coverage_percent}% ≥ 80%"
                
                print_success "🎉 TDD CYCLE COMPLETE!"
                echo ""
                print_info "📋 Cycle summary:"
                echo "  • 🔴 RED: Wrote failing test ✅"
                echo "  • 🟢 GREEN: Made tests pass ✅"
                echo "  • 🔵 REFACTOR: Improved code quality ✅"
                echo "  • 📊 COVER: Verified coverage ✅"
                echo ""
                print_success "Ready to commit with: ./scripts/safe-commit.sh"
                
                # Reset for next cycle
                CURRENT_PHASE="RED"
                save_tdd_state
                log_tdd_cycle "COVER" "Cycle complete - ready for commit"
                
            elif [[ "$coverage_percent" -ge 60 ]]; then
                print_warning "⚠️  Coverage below target: ${coverage_percent}% < 80% (minimum met)"
                print_info "Consider adding more tests or proceed to commit"
                echo ""
                echo "Continue anyway? (y/N): "
                read -r response
                if [[ "$response" =~ ^[Yy]$ ]]; then
                    print_success "✅ TDD cycle complete (with coverage warning)"
                    CURRENT_PHASE="RED"
                    save_tdd_state
                else
                    print_info "Add more tests to improve coverage"
                fi
            else
                print_error "❌ Coverage below minimum: ${coverage_percent}% < 60%"
                print_info "Add more tests before completing cycle"
                exit 1
            fi
        fi
    else
        print_warning "⚠️  Coverage analysis incomplete - proceeding"
    fi
}

# Function to check if commit is allowed (all phases complete)
check_commit_allowed() {
    load_tdd_state
    
    if [[ "$CURRENT_PHASE" == "RED" && "$CYCLE_COUNT" -gt 0 ]]; then
        print_success "✅ TDD cycle complete - commit allowed"
        return 0
    else
        print_error "❌ TDD cycle incomplete - commit blocked"
        echo ""
        echo "Current phase: $CURRENT_PHASE"
        echo "Complete the TDD cycle first:"
        echo "  🔴 RED → 🟢 GREEN → 🔵 REFACTOR → 📊 COVER → ✅ COMMIT"
        echo ""
        show_tdd_status
        return 1
    fi
}

# Main command handling
case "${1:-status}" in
    "red"|"start")
        start_red_phase
        ;;
    "verify-red")
        verify_red_phase
        ;;
    "green")
        start_green_phase
        ;;
    "verify-green")
        verify_green_phase
        ;;
    "refactor")
        start_refactor_phase
        ;;
    "cover")
        start_cover_phase
        ;;
    "status")
        show_tdd_status
        ;;
    "check-commit")
        check_commit_allowed
        ;;
    "reset")
        print_warning "Resetting TDD state..."
        rm -f "$TDD_STATE_FILE"
        print_success "TDD state reset - starting fresh RED phase"
        start_red_phase
        ;;
    "log")
        if [[ -f "$TDD_LOG_FILE" ]]; then
            echo "📝 TDD cycle history:"
            cat "$TDD_LOG_FILE"
        else
            print_info "No TDD cycles logged yet"
        fi
        ;;
    "help"|"-h"|"--help")
        echo "🔴🟢🔵 TDD Cycle Enforcer - Usage:"
        echo ""
        echo "TDD Cycle Commands:"
        echo "  red, start       Start RED phase (write failing test)"
        echo "  verify-red       Verify test fails (complete RED phase)"
        echo "  green            Start GREEN phase (make test pass)"
        echo "  verify-green     Verify tests pass (complete GREEN phase)"
        echo "  refactor         Start REFACTOR phase (improve code)"
        echo "  cover            Start COVER phase (verify coverage)"
        echo ""
        echo "Utility Commands:"
        echo "  status           Show current TDD phase and progress"
        echo "  check-commit     Check if commit is allowed (exit 1 if blocked)"
        echo "  reset            Reset TDD state and start fresh cycle"
        echo "  log              Show TDD cycle history"
        echo "  help             Show this help"
        echo ""
        echo "🔄 TDD Workflow:"
        echo "  1. 🔴 RED: Write a failing test"
        echo "  2. 🟢 GREEN: Make the test pass with minimal code"
        echo "  3. 🔵 REFACTOR: Improve code quality while keeping tests green"
        echo "  4. 📊 COVER: Verify adequate test coverage"
        echo "  5. ✅ COMMIT: Use safe-commit.sh to commit changes"
        echo ""
        echo "💡 Integration:"
        echo "  • Add to safe-commit.sh: ./scripts/tdd-cycle.sh check-commit"
        echo "  • Start new feature: ./scripts/tdd-cycle.sh red"
        echo "  • Track progress: ./scripts/tdd-cycle.sh status"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use: ./scripts/tdd-cycle.sh help"
        exit 1
        ;;
esac