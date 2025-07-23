#!/bin/bash
# TDD Auto-Cycle Manager - Intelligent TDD phase detection and advancement
# Usage: ./scripts/tdd-auto-cycle.sh [FEATURE_NAME]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

FEATURE_NAME="${1:-}"

# Auto-detect current TDD phase
detect_current_phase() {
    if ! grep -q "TDD Feature:" PROGRESS.md; then
        echo "NONE"
        return
    fi
    
    # Check what phase we're in based on checkmarks
    if ! grep -q "- RED: ✅" PROGRESS.md; then
        echo "RED"
    elif ! grep -q "- GREEN: ✅" PROGRESS.md; then
        echo "GREEN"
    elif ! grep -q "- REFACTOR: ✅" PROGRESS.md; then
        echo "REFACTOR"
    elif ! grep -q "- COVER: ✅" PROGRESS.md; then
        echo "COVER"
    elif ! grep -q "- COMMIT: ✅" PROGRESS.md; then
        echo "COMMIT"
    else
        echo "READY_FOR_NEXT"
    fi
}

# Auto-detect if tests are failing (RED phase completion)
check_red_completion() {
    echo -e "${BLUE}🔍 Checking if RED phase is complete...${NC}"
    
    # Run tests and check if any fail
    if dotnet test --no-build --verbosity quiet 2>/dev/null; then
        echo -e "${RED}❌ All tests passing - RED phase not complete${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Tests failing - RED phase complete${NC}"
        return 0
    fi
}

# Auto-detect if tests are passing (GREEN phase completion)
check_green_completion() {
    echo -e "${BLUE}🔍 Checking if GREEN phase is complete...${NC}"
    
    # Run tests and check if all pass
    if dotnet test --no-build --verbosity quiet 2>/dev/null; then
        echo -e "${GREEN}✅ All tests passing - GREEN phase complete${NC}"
        return 0
    else
        echo -e "${RED}❌ Tests still failing - GREEN phase not complete${NC}"
        return 1
    fi
}

# Auto-detect code quality improvements (REFACTOR phase)
check_refactor_suggestions() {
    echo -e "${BLUE}🔍 Analyzing code for refactoring opportunities...${NC}"
    
    # Check for code duplication, long methods, etc.
    # This is a simplified check - could be enhanced with static analysis tools
    local suggestions=()
    
    # Check for duplicate code patterns
    if grep -r "if (string.IsNullOrWhiteSpace" src/ | wc -l | awk '{if ($1 > 3) exit 0; else exit 1}'; then
        suggestions+=("Consider extracting validation logic to a common method")
    fi
    
    # Check for long methods
    if find src/ -name "*.cs" -exec awk '/^[[:space:]]*public|^[[:space:]]*private/ {method=1; lines=0} method==1 {lines++} /^[[:space:]]*}/ && method==1 {if (lines > 20) print FILENAME ":" FNR " Long method detected"; method=0}' {} \; | head -1 | grep -q "Long method"; then
        suggestions+=("Consider breaking down long methods")
    fi
    
    if [[ ${#suggestions[@]} -gt 0 ]]; then
        echo -e "${YELLOW}💡 Refactoring suggestions:${NC}"
        for suggestion in "${suggestions[@]}"; do
            echo "  - $suggestion"
        done
        return 1
    else
        echo -e "${GREEN}✅ Code quality looks good${NC}"
        return 0
    fi
}

# Initialize new TDD cycle
init_tdd_cycle() {
    local feature_name="$1"
    
    if [[ -z "$feature_name" ]]; then
        echo -e "${RED}❌ Feature name required for new TDD cycle${NC}"
        echo "Usage: $0 FEATURE_NAME"
        exit 1
    fi
    
    echo -e "${CYAN}🚀 Starting new TDD cycle: $feature_name${NC}"
    
    # Add TDD tracking section to PROGRESS.md
    cat >> PROGRESS.md << EOF

TDD Feature: $feature_name
- RED: ❌ Write failing test
- GREEN: ❌ Implement minimal code
- REFACTOR: ❌ Improve code quality
- COVER: ❌ Coverage verified
- COMMIT: ❌ Complete TDD cycle
EOF

    # Update status
    sed -i "s/TDD Cycle: .*/TDD Cycle: RED/" PROGRESS.md
    
    echo -e "${GREEN}✅ TDD cycle initialized${NC}"
    echo -e "${BLUE}📝 Next: Write a failing test for $feature_name${NC}"
}

# Main workflow
main() {
    echo -e "${CYAN}🤖 TDD Auto-Cycle Manager${NC}"
    echo "================================"
    
    current_phase=$(detect_current_phase)
    
    case "$current_phase" in
        "NONE")
            if [[ -n "$FEATURE_NAME" ]]; then
                init_tdd_cycle "$FEATURE_NAME"
            else
                echo -e "${YELLOW}⚠️  No TDD cycle in progress${NC}"
                echo "Start a new cycle with: $0 FEATURE_NAME"
            fi
            ;;
        "RED")
            echo -e "${RED}🔴 Current phase: RED${NC}"
            if check_red_completion; then
                ./scripts/tdd-mark-complete.sh RED "Failing test written and verified"
                echo -e "${BLUE}📝 Next: Implement minimal code to make test pass${NC}"
            else
                echo -e "${BLUE}📝 Write a failing test first${NC}"
            fi
            ;;
        "GREEN")
            echo -e "${GREEN}🟢 Current phase: GREEN${NC}"
            if check_green_completion; then
                ./scripts/tdd-mark-complete.sh GREEN "Minimal implementation completed"
                echo -e "${BLUE}📝 Next: Refactor code for quality${NC}"
            else
                echo -e "${BLUE}📝 Implement minimal code to make tests pass${NC}"
            fi
            ;;
        "REFACTOR")
            echo -e "${BLUE}🔵 Current phase: REFACTOR${NC}"
            if check_refactor_suggestions; then
                echo -e "${BLUE}📝 Consider refactoring before marking complete${NC}"
            else
                echo -e "${BLUE}📝 Ready to mark REFACTOR as complete${NC}"
            fi
            ;;
        "COVER")
            echo -e "${YELLOW}🟡 Current phase: COVER${NC}"
            echo -e "${BLUE}📝 Run coverage check: dotnet test --collect coverage${NC}"
            ;;
        "COMMIT")
            echo -e "${CYAN}🟣 Current phase: COMMIT${NC}"
            echo -e "${BLUE}📝 Ready to commit: ./scripts/safe-commit.sh${NC}"
            ;;
        "READY_FOR_NEXT")
            echo -e "${GREEN}✅ TDD cycle complete${NC}"
            echo -e "${BLUE}📝 Start next cycle with: $0 NEXT_FEATURE_NAME${NC}"
            ;;
    esac
}

main "$@"