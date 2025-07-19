#!/bin/bash

# tdd-enhanced-cycle.sh - Enhanced TDD cycle with integrated quality analysis
# Usage: ./scripts/tdd-enhanced-cycle.sh <phase> [feature-name] [description]

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
    echo -e "${BLUE}[TDD-ENHANCED]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validate phase parameter
PHASE="${1:-}"
FEATURE_NAME="${2:-}"
DESCRIPTION="${3:-}"

if [[ -z "$PHASE" ]]; then
    error "Phase is required. Usage: $0 <RED|GREEN|REFACTOR|COVER|COMMIT> [feature-name] [description]"
fi

# Enhanced phase execution with quality gates
execute_red_phase() {
    log "🔴 Executing RED phase - Write failing test"
    
    # Standard RED phase actions
    if [[ -n "$FEATURE_NAME" && -n "$DESCRIPTION" ]]; then
        # Auto-detect current issue/subissue from git branch
        local current_branch
        current_branch=$(git branch --show-current)
        
        # Extract issue info from branch name if following convention
        if [[ "$current_branch" =~ ^test/([0-9]+)-([0-9]+) ]]; then
            local issue_number="${BASH_REMATCH[1]}"
            local subissue_number="${BASH_REMATCH[2]}"
            local commit_message="$issue_number-$subissue_number Phase 1 RED $DESCRIPTION"
        else
            local commit_message="Phase 1 RED $DESCRIPTION"
        fi
        
        # Stage changes and commit
        git add .
        git commit -m "$commit_message" || warn "Commit failed - may need to stage changes manually"
    fi
    
    # Run tests to ensure they fail
    log "Verifying tests are failing..."
    if dotnet test --no-build --verbosity quiet 2>/dev/null; then
        error "❌ Tests are passing! RED phase requires failing tests"
    else
        success "✅ Tests failing as expected"
    fi
    
    # Quick code quality check on new test code
    log "Running quality check on new test code..."
    "$SCRIPT_DIR/analyze-code-context.sh" || warn "Quality analysis encountered issues"
}

execute_green_phase() {
    log "🟢 Executing GREEN phase - Make tests pass with minimal implementation"
    
    # Standard GREEN phase actions
    if [[ -n "$FEATURE_NAME" && -n "$DESCRIPTION" ]]; then
        local current_branch
        current_branch=$(git branch --show-current)
        
        if [[ "$current_branch" =~ ^test/([0-9]+)-([0-9]+) ]]; then
            local issue_number="${BASH_REMATCH[1]}"
            local subissue_number="${BASH_REMATCH[2]}"
            local commit_message="$issue_number-$subissue_number Phase 2 GREEN $DESCRIPTION"
        else
            local commit_message="Phase 2 GREEN $DESCRIPTION"
        fi
        
        git add .
        git commit -m "$commit_message" || warn "Commit failed - may need to stage changes manually"
    fi
    
    # Run tests to ensure they pass
    log "Verifying tests are passing..."
    if ! dotnet test --no-build --verbosity quiet 2>/dev/null; then
        error "❌ Tests are still failing! GREEN phase requires passing tests"
    else
        success "✅ Tests passing - GREEN phase complete"
    fi
    
    # Quick code quality check on implementation
    log "Running quality check on implementation..."
    "$SCRIPT_DIR/analyze-code-context.sh" || warn "Quality analysis encountered issues"
}

execute_refactor_phase() {
    log "🔄 Executing REFACTOR phase - Improve code quality while maintaining tests"
    
    # Run pre-refactor test validation
    log "Running pre-refactor test validation..."
    if ! dotnet test --no-build --verbosity quiet 2>/dev/null; then
        error "❌ Tests must pass before refactoring"
    fi
    
    # Enhanced quality analysis before refactoring
    log "Analyzing code for refactoring opportunities..."
    "$SCRIPT_DIR/analyze-code-context.sh" --auto-create-issues || warn "Quality analysis encountered issues"
    
    # Standard REFACTOR phase actions
    if [[ -n "$FEATURE_NAME" && -n "$DESCRIPTION" ]]; then
        local current_branch
        current_branch=$(git branch --show-current)
        
        if [[ "$current_branch" =~ ^test/([0-9]+)-([0-9]+) ]]; then
            local issue_number="${BASH_REMATCH[1]}"
            local subissue_number="${BASH_REMATCH[2]}"
            local commit_message="$issue_number-$subissue_number Phase 3 REFACTOR $DESCRIPTION"
        else
            local commit_message="Phase 3 REFACTOR $DESCRIPTION"
        fi
        
        git add .
        git commit -m "$commit_message" || warn "Commit failed - may need to stage changes manually"
    fi
    
    # Run post-refactor test validation
    log "Running post-refactor test validation..."
    if ! dotnet test --no-build --verbosity quiet 2>/dev/null; then
        error "❌ Refactoring broke tests! Please fix before proceeding"
    else
        success "✅ Refactoring complete - tests still passing"
    fi
}

execute_cover_phase() {
    log "📊 Executing COVER phase - Validate test coverage"
    
    # Run coverage analysis
    log "Running test coverage analysis..."
    dotnet test --collect:"XPlat Code Coverage" --verbosity quiet
    
    # Check coverage threshold (95%)
    local coverage_file
    coverage_file=$(find . -name "coverage.cobertura.xml" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2- || echo "")
    
    if [[ -n "$coverage_file" ]]; then
        # Extract coverage percentage (simplified)
        local coverage_percent
        coverage_percent=$(grep -o 'line-rate="[0-9.]*"' "$coverage_file" | head -1 | grep -o '[0-9.]*' | awk '{print $1 * 100}')
        
        if (( $(echo "$coverage_percent >= 95" | bc -l) )); then
            success "✅ Coverage is ${coverage_percent}% - meets 95% threshold"
        else
            warn "⚠️ Coverage is ${coverage_percent}% - below 95% threshold"
            
            # Auto-create coverage gap analysis
            log "Creating coverage gap analysis..."
            "$SCRIPT_DIR/analyze-coverage-gaps.sh" 2>/dev/null || warn "Coverage gap analysis script not found"
        fi
    else
        warn "Could not find coverage report - coverage validation skipped"
    fi
    
    # Comprehensive quality analysis
    log "Running comprehensive code quality analysis..."
    "$SCRIPT_DIR/analyze-code-context.sh" --auto-create-issues
    
    # Standard COVER phase commit
    if [[ -n "$FEATURE_NAME" && -n "$DESCRIPTION" ]]; then
        local current_branch
        current_branch=$(git branch --show-current)
        
        if [[ "$current_branch" =~ ^test/([0-9]+)-([0-9]+) ]]; then
            local issue_number="${BASH_REMATCH[1]}"
            local subissue_number="${BASH_REMATCH[2]}"
            local commit_message="$issue_number-$subissue_number Phase 4 COVER $DESCRIPTION"
        else
            local commit_message="Phase 4 COVER $DESCRIPTION"
        fi
        
        git add .
        git commit -m "$commit_message" || warn "Commit failed - may need to stage changes manually"
    fi
}

execute_commit_phase() {
    log "💾 Executing COMMIT phase - Final validation and feature completion"
    
    # Run all tests one final time
    log "Running final test validation..."
    if ! dotnet test --verbosity quiet; then
        error "❌ Tests failing - cannot complete COMMIT phase"
    fi
    
    # Run mutation testing if available
    if command -v dotnet-stryker &> /dev/null; then
        log "Running mutation testing..."
        dotnet stryker --threshold-high 85 --threshold-low 60 || warn "Mutation testing below threshold"
    else
        warn "Stryker mutation testing not available - consider installing"
    fi
    
    # Final comprehensive analysis
    log "Running final code quality analysis..."
    "$SCRIPT_DIR/analyze-code-context.sh" --auto-create-issues
    
    # Standard COMMIT phase actions
    if [[ -n "$FEATURE_NAME" && -n "$DESCRIPTION" ]]; then
        local current_branch
        current_branch=$(git branch --show-current)
        
        if [[ "$current_branch" =~ ^test/([0-9]+)-([0-9]+) ]]; then
            local issue_number="${BASH_REMATCH[1]}"
            local subissue_number="${BASH_REMATCH[2]}"
            local commit_message="$issue_number-$subissue_number Phase 5 COMMIT $DESCRIPTION"
        else
            local commit_message="Phase 5 COMMIT $DESCRIPTION"
        fi
        
        git add .
        git commit -m "$commit_message" || warn "Commit failed - may need to stage changes manually"
    fi
    
    success "🎉 TDD cycle complete for $FEATURE_NAME"
    
    # Suggest next steps
    log "Next steps:"
    echo "  1. Review any auto-created quality issues"
    echo "  2. Consider merging this subissue to feature branch"
    echo "  3. Start next TDD cycle or move to feature-level validation"
}

# Main execution
case "$PHASE" in
    "RED"|"red")
        execute_red_phase
        ;;
    "GREEN"|"green")
        execute_green_phase
        ;;
    "REFACTOR"|"refactor"|"REF"|"ref")
        execute_refactor_phase
        ;;
    "COVER"|"cover"|"COV"|"cov")
        execute_cover_phase
        ;;
    "COMMIT"|"commit")
        execute_commit_phase
        ;;
    *)
        error "Invalid phase: $PHASE. Must be one of: RED, GREEN, REFACTOR, COVER, COMMIT"
        ;;
esac

success "Phase $PHASE completed successfully"