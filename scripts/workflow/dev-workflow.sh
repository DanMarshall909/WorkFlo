#!/bin/bash
# Development Workflow Script - Free Tier Optimized
# Combines local CI with safe commit practices

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🏗️  WorkFlo Development Workflow (Free Tier Optimized)${NC}"
echo "=================================================="

# Check if on the main development branch (trunk-based development)
current_branch=$(git branch --show-current)
TARGET_BRANCH="${WORKFLO_MAIN_BRANCH:-master}"  # Trunk-based development
if [[ "$current_branch" != "$TARGET_BRANCH" ]]; then
    echo -e "${YELLOW}⚠️  Not on $TARGET_BRANCH branch. Switching to $TARGET_BRANCH...${NC}"
    git checkout "$TARGET_BRANCH"
    git pull origin "$TARGET_BRANCH"
fi

# Run local CI first
echo ""
echo -e "${BLUE}📋 Step 1: Local CI Checks${NC}"
"$SCRIPT_DIR/local-ci.sh"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo ""
    echo -e "${BLUE}📋 Step 2: Commit Changes${NC}"
    echo "Uncommitted changes detected. Choose action:"
    echo "1. Use safe-commit (recommended)"
    echo "2. Stage all and commit"
    echo "3. Skip commit"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            echo "Enter commit message:"
            read -r message
            "$SCRIPT_DIR/safe-commit.sh" "$message"
            ;;
        2)
            git add .
            echo "Enter commit message:"
            read -r message
            git commit -m "$message"
            ;;
        3)
            echo "Skipping commit..."
            ;;
        *)
            echo "Invalid choice. Exiting."
            exit 1
            ;;
    esac
fi

# Offer to push
echo ""
echo -e "${BLUE}📋 Step 3: Push to Remote${NC}"
read -p "Push to origin/$TARGET_BRANCH? (y/N): " push_choice
if [[ "$push_choice" =~ ^[Yy]$ ]]; then
    git push origin "$TARGET_BRANCH"
    echo ""
    echo -e "${GREEN}🎉 Workflow complete! Changes pushed to $TARGET_BRANCH branch.${NC}"
else
    echo -e "${YELLOW}ℹ️  Changes committed locally but not pushed.${NC}"
fi

echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo "- Continue development on $TARGET_BRANCH branch"
echo "- When ready: create PR to merge changes"
echo "- GitHub Actions will run minimal CI on push"