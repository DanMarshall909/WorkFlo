#!/bin/bash
# TDD Progress Tracker - Mark TDD phases as complete
# Usage: ./scripts/tdd-mark-complete.sh PHASE [DESCRIPTION]

set -e

PHASE="$1"
DESCRIPTION="${2:-Completed}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [[ -z "$PHASE" ]]; then
    echo -e "${RED}❌ Error: Phase required${NC}"
    echo "Usage: $0 PHASE [DESCRIPTION]"
    echo "Valid phases: RED, GREEN, REFACTOR, COVER, COMMIT"
    exit 1
fi

# Validate phase
case "$PHASE" in
    "RED"|"GREEN"|"REFACTOR"|"COVER"|"COMMIT")
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid phase '$PHASE'${NC}"
        echo "Valid phases: RED, GREEN, REFACTOR, COVER, COMMIT"
        exit 1
        ;;
esac

# Check if PROGRESS.md exists
if [[ ! -f "PROGRESS.md" ]]; then
    echo -e "${RED}❌ Error: PROGRESS.md not found${NC}"
    exit 1
fi

# Mark phase as complete
sed -i "s/- $PHASE: ❌.*/- $PHASE: ✅ $DESCRIPTION/" PROGRESS.md

# Update current TDD cycle status
case "$PHASE" in
    "RED")
        sed -i "s/TDD Cycle: .*/TDD Cycle: RED/" PROGRESS.md
        ;;
    "GREEN")
        sed -i "s/TDD Cycle: .*/TDD Cycle: GREEN/" PROGRESS.md
        ;;
    "REFACTOR")
        sed -i "s/TDD Cycle: .*/TDD Cycle: REFACTOR/" PROGRESS.md
        ;;
    "COVER")
        sed -i "s/TDD Cycle: .*/TDD Cycle: COVER/" PROGRESS.md
        ;;
    "COMMIT")
        sed -i "s/TDD Cycle: .*/TDD Cycle: READY_FOR_NEXT/" PROGRESS.md
        ;;
esac

echo -e "${GREEN}✅ Marked TDD phase $PHASE as complete in PROGRESS.md${NC}"
echo -e "${BLUE}📄 Description: $DESCRIPTION${NC}"

# Show current TDD status
echo ""
echo -e "${YELLOW}Current TDD Status:${NC}"
grep -A 6 "TDD Feature:" PROGRESS.md || echo "No TDD feature tracking found"