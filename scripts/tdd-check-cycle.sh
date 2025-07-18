#!/bin/bash
# TDD Cycle Checker - Verify TDD cycle completion before commits
# Usage: ./scripts/tdd-check-cycle.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_tdd_phase() {
    local phase="$1"
    # Use awk to check if the phase line contains checkmark
    if awk "/- $phase:/ { if (\$0 ~ /✅/) exit 0; else exit 1 }" PROGRESS.md; then
        echo -e "${GREEN}✅ $phase: Complete${NC}"
        return 0
    else
        echo -e "${RED}❌ $phase: Incomplete${NC}"
        return 1
    fi
}

echo -e "${BLUE}🔍 Checking TDD Cycle Completion...${NC}"
echo ""

# Check if PROGRESS.md exists
if [[ ! -f "PROGRESS.md" ]]; then
    echo -e "${RED}❌ Error: PROGRESS.md not found${NC}"
    exit 1
fi

# Check if TDD tracking is present
if ! grep -q "TDD Feature:" PROGRESS.md; then
    echo -e "${YELLOW}⚠️  No TDD cycle tracking found in PROGRESS.md${NC}"
    echo -e "${BLUE}ℹ️  TDD cycle verification skipped${NC}"
    exit 0
fi

# Check each phase
failed_phases=()

check_tdd_phase "RED" || failed_phases+=("RED")
check_tdd_phase "GREEN" || failed_phases+=("GREEN") 
check_tdd_phase "REFACTOR" || failed_phases+=("REFACTOR")
check_tdd_phase "COVER" || failed_phases+=("COVER")

echo ""

if [[ ${#failed_phases[@]} -eq 0 ]]; then
    echo -e "${GREEN}🎉 TDD Cycle Complete! Ready to commit.${NC}"
    exit 0
else
    echo -e "${RED}❌ TDD Cycle Incomplete${NC}"
    echo -e "${YELLOW}Missing phases: ${failed_phases[*]}${NC}"
    echo ""
    echo -e "${BLUE}💡 Complete missing phases before committing:${NC}"
    for phase in "${failed_phases[@]}"; do
        case "$phase" in
            "RED")
                echo "  - Write failing test: Add test that fails"
                ;;
            "GREEN")
                echo "  - Implement minimal code: Make test pass"
                ;;
            "REFACTOR")
                echo "  - Refactor code: Improve quality, DRY, SOLID principles"
                ;;
            "COVER")
                echo "  - Check coverage: Run dotnet test --collect coverage"
                ;;
        esac
    done
    echo ""
    echo -e "${BLUE}Use: ./scripts/tdd-mark-complete.sh PHASE to mark phases complete${NC}"
    exit 1
fi