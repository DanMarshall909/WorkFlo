#!/bin/bash
# auto-version-tag.sh - Automatically tag versions when merging to main
# This script should be called from CI/CD or manually after merging to main

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "${BLUE}🏷️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

print_header "Automatic Version Tagging for Main Branch"
echo ""

# Check if we're in a git repository
if [[ ! -d ".git" ]]; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if we're on main branch
current_branch=$(git symbolic-ref HEAD | sed 's|refs/heads/||')
if [[ "$current_branch" != "main" ]]; then
    print_error "Not on main branch (current: $current_branch)"
    echo "This script should only run on main branch after merges"
    exit 1
fi

# Get current version from backend csproj
CSPROJ_FILE="src/Anchor.Api/Anchor.Api.csproj"
if [[ ! -f "$CSPROJ_FILE" ]]; then
    print_error "Backend project file not found: $CSPROJ_FILE"
    exit 1
fi

CURRENT_VERSION=$(grep -o '<Version>[^<]*</Version>' "$CSPROJ_FILE" | sed 's/<Version>//;s/<\/Version>//')
if [[ -z "$CURRENT_VERSION" ]]; then
    print_error "Could not extract version from $CSPROJ_FILE"
    exit 1
fi

print_info "Current version in csproj: $CURRENT_VERSION"

# Check if this version is already tagged
if git tag -l | grep -q "^v$CURRENT_VERSION$"; then
    print_warning "Version v$CURRENT_VERSION is already tagged"
    
    # Check if there are commits since the last tag
    LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    if [[ -n "$LAST_TAG" ]]; then
        COMMITS_SINCE_TAG=$(git rev-list ${LAST_TAG}..HEAD --count)
        if [[ "$COMMITS_SINCE_TAG" -eq 0 ]]; then
            print_info "No new commits since last tag. Nothing to do."
            exit 0
        else
            print_warning "Found $COMMITS_SINCE_TAG commits since tag $LAST_TAG"
            echo "Consider updating the version number in $CSPROJ_FILE"
            
            # Auto-increment patch version
            echo ""
            echo "Auto-increment version? (y/N): "
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                NEW_VERSION=$(echo "$CURRENT_VERSION" | awk -F. '{$NF = $NF + 1; print}' OFS=.)
                print_info "Auto-incrementing to version: $NEW_VERSION"
                
                # Update backend version
                sed -i "s/<Version>$CURRENT_VERSION<\/Version>/<Version>$NEW_VERSION<\/Version>/" "$CSPROJ_FILE"
                sed -i "s/<AssemblyVersion>$CURRENT_VERSION<\/AssemblyVersion>/<AssemblyVersion>$NEW_VERSION<\/AssemblyVersion>/" "$CSPROJ_FILE"
                sed -i "s/<FileVersion>$CURRENT_VERSION<\/FileVersion>/<FileVersion>$NEW_VERSION<\/FileVersion>/" "$CSPROJ_FILE"
                
                # Update frontend version
                PACKAGE_JSON="src/web/package.json"
                if [[ -f "$PACKAGE_JSON" ]]; then
                    sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"
                fi
                
                # Commit version updates
                git add "$CSPROJ_FILE" "$PACKAGE_JSON"
                git commit -m "chore: bump version to $NEW_VERSION

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
                
                CURRENT_VERSION="$NEW_VERSION"
                print_success "Version updated to $NEW_VERSION"
            else
                print_warning "Skipping version update"
                exit 0
            fi
        fi
    fi
fi

# Get the latest commit hash and short hash
COMMIT_HASH=$(git rev-parse HEAD)
SHORT_COMMIT=$(git rev-parse --short HEAD)

# Get commit message for tag annotation
COMMIT_MESSAGE=$(git log -1 --pretty=%B)

# Create annotated tag
TAG_NAME="v$CURRENT_VERSION"
print_info "Creating tag: $TAG_NAME"

# Create tag message with commit info
TAG_MESSAGE="Release $CURRENT_VERSION

$(echo "$COMMIT_MESSAGE" | head -1)

Commit: $SHORT_COMMIT
Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Branch: main

🤖 Auto-tagged by version management script"

git tag -a "$TAG_NAME" -m "$TAG_MESSAGE"

print_success "✅ Created tag: $TAG_NAME"

# Push tag to remote
print_info "Pushing tag to remote..."
if git push origin "$TAG_NAME"; then
    print_success "✅ Tag pushed to remote successfully"
else
    print_error "❌ Failed to push tag to remote"
    exit 1
fi

# Update version info in both projects with git commit hash
print_info "Updating version info with commit hash..."

# Update backend with commit hash
if [[ -f "$CSPROJ_FILE" ]]; then
    sed -i "s/<InformationalVersion>[^<]*<\/InformationalVersion>/<InformationalVersion>$CURRENT_VERSION+$SHORT_COMMIT<\/InformationalVersion>/" "$CSPROJ_FILE"
fi

# Create a version info file for frontend build
cat > "src/web/version-info.json" << EOF
{
  "version": "$CURRENT_VERSION",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "gitCommit": "$SHORT_COMMIT",
  "gitCommitFull": "$COMMIT_HASH",
  "tag": "$TAG_NAME",
  "branch": "main"
}
EOF

print_success "✅ Version info updated"

echo ""
print_header "🎉 Version Tagging Complete!"
echo ""
print_info "📋 Summary:"
echo "  • Version: $CURRENT_VERSION"
echo "  • Tag: $TAG_NAME"
echo "  • Commit: $SHORT_COMMIT"
echo "  • Pushed to remote: ✅"
echo ""
print_info "🔗 View release:"
echo "  • GitHub: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]//;s/.git$//')/releases/tag/$TAG_NAME"
echo "  • Local tags: git tag -l"
echo ""
print_info "🚀 Next steps:"
echo "  • Deploy from tag: $TAG_NAME"
echo "  • Update CHANGELOG.md if needed"
echo "  • Announce release to stakeholders"