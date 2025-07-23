#!/bin/bash
set -e

# WorkFlo Project - Safe Merge to Main Script
# Enforces quality checks before merging development branch to main

echo "⚓ WorkFlo Project: Safe Merge to Main"
echo "===================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check current branch (configurable for trunk-based development)
# TODO: This script will be deprecated after trunk-based migration
TARGET_BRANCH="${WORKFLO_MAIN_BRANCH:-master}"  # Trunk-based development
current_branch=$(git branch --show-current)
if [ "$current_branch" != "$TARGET_BRANCH" ]; then
    echo -e "${RED}❌ Must be on $TARGET_BRANCH branch to merge to main${NC}"
    echo "Current branch: $current_branch"
    echo "Run: git checkout $TARGET_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --staged --quiet; then
    echo -e "${RED}❌ Uncommitted changes detected${NC}"
    echo "Please commit or stash all changes before merging"
    exit 1
fi

# Run pre-merge quality check
echo -e "${BLUE}🔍 Running pre-merge quality check...${NC}"
echo
if ! ./scripts/local-pre-merge-check.sh; then
    echo
    echo -e "${RED}❌ Pre-merge quality check failed${NC}"
    echo "Fix the issues above before merging to main"
    exit 1
fi

echo
echo -e "${GREEN}✅ Quality check passed!${NC}"
echo

# Confirm merge
echo -e "${YELLOW}⚠️  Ready to merge $TARGET_BRANCH → main${NC}"
echo "This will:"
echo "  1. Switch to main branch"
echo "  2. Merge $TARGET_BRANCH branch"
echo "  3. Push to origin/main"
echo
read -p "Continue with merge? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Merge cancelled."
    exit 0
fi

# Perform the merge
echo
echo -e "${BLUE}📦 Merging $TARGET_BRANCH to main...${NC}"

# Switch to main and merge
git checkout main
git pull origin main  # Ensure main is up to date
git merge $TARGET_BRANCH --no-ff -m "feat: merge $TARGET_BRANCH improvements

$(git log --oneline main..$TARGET_BRANCH | head -5)

🤖 Generated with [Claude Code](https://claude.ai/code)"

echo -e "${GREEN}✅ Merge completed successfully${NC}"

# Ask about pushing
echo
read -p "Push to origin/main? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo -e "${GREEN}✅ Pushed to origin/main${NC}"
else
    echo -e "${YELLOW}⚠️  Merge completed locally but not pushed${NC}"
    echo "Run 'git push origin main' when ready"
fi

# Switch back to development branch
git checkout $TARGET_BRANCH
echo
echo -e "${GREEN}🎉 Merge process complete!${NC}"
echo "Switched back to $TARGET_BRANCH branch for continued development"