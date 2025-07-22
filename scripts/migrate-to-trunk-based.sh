#!/bin/bash
# Migration helper script for trunk-based development
# This script helps transition from dev branch to master branch workflow

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 WorkFlo Trunk-Based Development Migration Helper${NC}"
echo "=================================================="
echo ""

# Check if already migrated
if [[ "${WORKFLO_MAIN_BRANCH:-}" == "master" ]]; then
    echo -e "${GREEN}✅ Already migrated to trunk-based development!${NC}"
    exit 0
fi

# Display migration plan
echo -e "${YELLOW}📋 Migration Plan:${NC}"
echo "1. Set WORKFLO_MAIN_BRANCH=master environment variable"
echo "2. Update local git configuration"
echo "3. Provide instructions for completing migration"
echo ""

read -p "Continue with migration setup? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

# Create or update shell profile
SHELL_PROFILE=""
if [[ -f "$HOME/.bashrc" ]]; then
    SHELL_PROFILE="$HOME/.bashrc"
elif [[ -f "$HOME/.zshrc" ]]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [[ -f "$HOME/.profile" ]]; then
    SHELL_PROFILE="$HOME/.profile"
fi

if [[ -n "$SHELL_PROFILE" ]]; then
    echo ""
    echo -e "${BLUE}📝 Adding environment variable to $SHELL_PROFILE${NC}"
    
    # Check if already exists
    if grep -q "WORKFLO_MAIN_BRANCH" "$SHELL_PROFILE"; then
        echo -e "${YELLOW}⚠️  WORKFLO_MAIN_BRANCH already set in profile${NC}"
    else
        echo "" >> "$SHELL_PROFILE"
        echo "# WorkFlo trunk-based development configuration" >> "$SHELL_PROFILE"
        echo "export WORKFLO_MAIN_BRANCH=master" >> "$SHELL_PROFILE"
        echo -e "${GREEN}✅ Added WORKFLO_MAIN_BRANCH=master to profile${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not find shell profile file${NC}"
    echo "Please add this to your shell profile manually:"
    echo "export WORKFLO_MAIN_BRANCH=master"
fi

# Create migration checklist
echo ""
echo -e "${BLUE}📋 Migration Checklist:${NC}"
echo ""
echo "1. [ ] Set environment variable (done above or manually)"
echo "2. [ ] Reload shell: source $SHELL_PROFILE"
echo "3. [ ] Ensure all work on dev branch is merged"
echo "4. [ ] Delete local dev branch: git branch -d dev"
echo "5. [ ] Update CI/CD pipelines if needed"
echo ""

echo -e "${YELLOW}🔧 Testing the Migration:${NC}"
echo ""
echo "1. Open a new terminal or run: source $SHELL_PROFILE"
echo "2. Run: ./sw (should now use master branch)"
echo "3. Run: ./scripts/safe-commit.sh \"test: verify migration\""
echo ""

echo -e "${GREEN}✅ Migration setup complete!${NC}"
echo ""
echo -e "${BLUE}ℹ️  Note:${NC} The scripts now support both workflows:"
echo "- Current: dev branch (default)"
echo "- Future: master branch (when WORKFLO_MAIN_BRANCH=master)"
echo ""
echo "To revert: unset WORKFLO_MAIN_BRANCH or set it to 'dev'"