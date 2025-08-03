#!/bin/bash
# Fallback AI Provider for WorkFlo TDD
# Provides enhanced heuristic analysis when AI providers are unavailable

# Enhanced fallback review implementation
ai_review() {
    local changes="$1"
    local branch="$2"
    local commit_msg="$3"
    
    echo "🔍 Enhanced Fallback Analysis (No External AI)"
    echo "Branch: $branch"
    echo "Recent commit: $commit_msg"
    echo "Changes: $(echo "$changes" | wc -l) lines modified"
    echo ""
    
    # Enhanced static analysis
    local line_count=$(echo "$changes" | wc -l)
    local score=75
    
    # Advanced heuristics
    if echo "$changes" | grep -qE "test|spec"; then
        score=$((score + 10))
        echo "✅ Test coverage detected (+10 points)"
    fi
    
    if [[ $line_count -gt 100 ]]; then
        score=$((score - 15))
        echo "⚠️ Large changeset (-15 points)"
    fi
    
    if echo "$changes" | grep -qE "TODO|FIXME"; then
        score=$((score - 10))
        echo "⚠️ Technical debt markers (-10 points)"
    fi
    
    if echo "$changes" | grep -qE "function|class|interface"; then
        score=$((score + 5))
        echo "✅ Good code structure (+5 points)"
    fi
    
    echo ""
    echo "🏆 Quality Score: $score/100 (enhanced fallback)"
    echo ""
    echo "📋 Detailed Analysis:"
    echo "  • Code structure: $(echo "$changes" | grep -c "function\|class\|interface") new components"
    echo "  • Test additions: $(echo "$changes" | grep -c "test\|spec") test-related changes"
    echo "  • Documentation: $(echo "$changes" | grep -c "#\|//\|/\*") comment lines"
    echo ""
    echo "💡 Recommendations:"
    echo "  • Install AI provider (Claude, etc.) for detailed analysis"
    echo "  • Consider breaking large changes into smaller commits"
    echo "  • Ensure comprehensive test coverage"
}

# AI-assisted test generation fallback
ai_generate_test() {
    local issue_number="$1"
    local criteria_number="$2"
    local criteria_text="$3"
    local project_type="$4"
    
    echo "🔍 Enhanced Test Generation (Fallback Mode)"
    echo ""
    echo "Criteria: $criteria_text"
    echo "Project: $project_type"
    echo "Issue: #$issue_number (Criterion $criteria_number)"
    echo ""
    echo "📋 Test Strategy Recommendations:"
    echo "  • Use business scenario naming (not 'should' statements)"
    echo "  • Follow Given-When-Then structure"
    echo "  • Test should fail initially (RED phase requirement)"
    echo "  • Focus ONLY on this specific criteria"
    echo ""
    echo "🛠️ Framework-specific guidance:"
    case "$project_type" in
        nodejs) echo "  • Use Jest: describe() and it() blocks" ;;
        dotnet) echo "  • Use xUnit: [Fact] attributes and business naming" ;;
        bash) echo "  • Use BATS: @test \"business scenario\" format" ;;
        *) echo "  • Use appropriate test framework for $project_type" ;;
    esac
    echo ""
    echo "💡 Consider installing AI provider for detailed test generation"
}

# AI-assisted implementation fallback
ai_implement_minimal() {
    local test_failure_output="$1"
    local criteria_text="$2"
    local project_type="$3"
    
    echo "🔍 Enhanced Implementation Guide (Fallback Mode)"
    echo ""
    echo "Criteria: $criteria_text"
    echo "Project: $project_type"
    echo "Strategy: Implement minimal code to make test pass"
    echo ""
    echo "📋 TDD Implementation Principles:"
    echo "  • Write the simplest possible solution"
    echo "  • No extra features or optimizations"
    echo "  • Make the test green with minimal code"
    echo "  • Don't anticipate future requirements"
    echo ""
    if [[ -n "$test_failure_output" ]]; then
        echo "🔍 Test failure analysis available:"
        echo "$(echo "$test_failure_output" | head -3 | sed 's/^/  /')"
    fi
    echo ""
    echo "💡 Consider installing AI provider for detailed implementation guidance"
}

# AI-assisted refactoring fallback
ai_suggest_refactoring() {
    local current_code="$1"
    local criteria_text="$2"
    local phase="$3"
    
    echo "🔍 Enhanced Refactoring Analysis (Fallback Mode)"
    echo ""
    echo "Criteria: $criteria_text"
    echo "Phase: $phase"
    echo "Code size: $(echo "$current_code" | wc -l) lines"
    echo ""
    echo "📋 Refactoring Checklist:"
    echo "  ✅ Extract common functionality into methods"
    echo "  ✅ Improve variable and method naming"
    echo "  ✅ Remove code duplication"
    echo "  ✅ Simplify complex conditional logic"
    echo "  ✅ Ensure all tests still pass after changes"
    echo ""
    echo "🎯 Focus Areas:"
    if echo "$current_code" | grep -q "if.*&&.*||"; then
        echo "  • Simplify complex conditional expressions"
    fi
    if echo "$current_code" | grep -qE "(.{80,})"; then
        echo "  • Break down long lines for readability"
    fi
    echo "  • Maintain current test coverage"
    echo ""
    echo "💡 Consider installing AI provider for specific refactoring suggestions"
}

# AI-assisted edge case analysis fallback
ai_design_edge_cases() {
    local criteria_text="$1"
    local existing_tests="$2"
    local implementation="$3"
    
    echo "🔍 Enhanced Edge Case Analysis (Fallback Mode)"
    echo ""
    echo "Criteria: $criteria_text"
    echo "Existing tests: $(echo "$existing_tests" | grep -c "test\|it\|@test") test methods"
    echo "Implementation: $(echo "$implementation" | wc -l) lines of code"
    echo ""
    echo "📋 Edge Case Categories to Consider:"
    echo "  🎯 Boundary conditions (min/max values, empty inputs)"
    echo "  ❌ Error scenarios (invalid inputs, null values)"
    echo "  🔀 Input variations (different data types, formats)"
    echo "  🌐 Environmental factors (network issues, file permissions)"
    echo "  🔄 Concurrent access scenarios (if applicable)"
    echo ""
    echo "🎯 Coverage Target: >85% mutation score"
    echo ""
    echo "📊 Test Strategy:"
    echo "  • Add negative test cases for error handling"
    echo "  • Test with boundary values (0, -1, max integer)"
    echo "  • Verify behavior with unexpected input types"
    echo ""
    echo "💡 Consider installing AI provider for specific edge case generation"
}

# AI-assisted error diagnosis fallback
ai_diagnose_error() {
    local error_output="$1"
    local phase="$2"
    local context="$3"
    
    echo "🔍 Enhanced Error Diagnosis (Fallback Mode)"
    echo ""
    echo "Phase: $phase"
    echo "Context: $context"
    echo ""
    echo "📋 Common Error Patterns by Phase:"
    case "$phase" in
        RED)
            echo "  • Test framework not properly configured"
            echo "  • Missing test dependencies or imports"
            echo "  • Incorrect test assertions or setup"
            ;;
        GREEN)
            echo "  • Implementation doesn't match test expectations"
            echo "  • Missing method or class implementations"
            echo "  • Incorrect return types or values"
            ;;
        REFACTOR)
            echo "  • Broke existing functionality during refactoring"
            echo "  • Test setup no longer valid after changes"
            echo "  • Introduced new dependencies or imports"
            ;;
        COVER)
            echo "  • Edge case tests revealing implementation bugs"
            echo "  • Missing error handling in implementation"
            echo "  • Test environment or data setup issues"
            ;;
    esac
    echo ""
    if [[ -n "$error_output" ]]; then
        echo "🔍 Error output analysis:"
        echo "$(echo "$error_output" | head -5 | sed 's/^/  /')"
    fi
    echo ""
    echo "💡 Consider installing AI provider for detailed error analysis"
}

# Fallback commit message generation
generate_commit_message() {
    local phase="$1"
    local criteria="$2"
    local criteria_text="$3"
    local issue="$4"
    local issue_title="$5"
    
    echo "Co-Authored-By: WorkFlo-TDD <noreply@workflo.dev>"
}

# Fallback PR content generation
generate_pr_content() {
    local issue="$1"
    local issue_title="$2"
    
    echo "🤖 Generated with WorkFlo TDD automation"
}

# Export functions for use by main script
export -f ai_review
export -f generate_commit_message
export -f generate_pr_content
export -f ai_generate_test
export -f ai_implement_minimal
export -f ai_suggest_refactoring
export -f ai_design_edge_cases
export -f ai_diagnose_error