#!/bin/bash

# update-progress.sh - Enhanced Smart Progress Tracker
# Automatically updates PROGRESS.md with current development status
# Features: Change detection, caching, API optimization, git commit tracking
#
# Usage: ./scripts/update-progress.sh [ACTION] [DESCRIPTION] [FEATURE_NAME] [--commit]
#
# Examples:
#   ./scripts/update-progress.sh                    # Auto-detect changes
#   ./scripts/update-progress.sh "testing" "Added useSessionMachine tests" "session-timer"
#   ./scripts/update-progress.sh "complete" "Finished Phase 3" "session-timer" --commit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROGRESS_FILE="PROGRESS.md"
CACHE_DIR=".progress-cache"
STATE_CACHE="$CACHE_DIR/state.cache"
GITHUB_CACHE="$CACHE_DIR/github.cache"
COMMIT_CACHE="$CACHE_DIR/commit.cache"
LAST_HASH_FILE="$CACHE_DIR/last-hash"
ACTION="${1:-auto}"
DESCRIPTION="${2:-}"
FEATURE_NAME="${3:-}"
COMMIT_FLAG="${4:-}"

# Create cache directory if it doesn't exist
mkdir -p "$CACHE_DIR"

echo -e "${BLUE}🔄 Smart Progress Tracker - Analyzing changes...${NC}"

# Function to generate state hash
generate_state_hash() {
    # Only include development files in git status hash, exclude ALL progress tracking files
    local development_git_status=$(git status --porcelain | \
                                 grep -v "PROGRESS.md" | \
                                 grep -v ".progress-cache" | \
                                 grep -v ".auto-progress" | \
                                 grep -v ".progress-server.pid" | \
                                 grep -v "progress.html" | \
                                 grep -v "server.pid" | \
                                 sort | sha256sum | cut -d' ' -f1)
    
    # Hash core PROGRESS.md content (task checkboxes and main sections only)
    local progress_content_hash=""
    if [ -f "$PROGRESS_FILE" ]; then
        progress_content_hash=$(sed '/### 🔄 Recent Updates/,$ d' "$PROGRESS_FILE" | \
                              grep -v "Last Updated" | \
                              grep -v "Latest Git Commit" | \
                              grep -v "State Hash" | \
                              grep -v "Files Created:" | \
                              grep -v "Files Modified:" | \
                              sha256sum | cut -d' ' -f1)
    fi
    
    local commit_hash=$(git rev-parse HEAD 2>/dev/null || echo "no-commits")
    local branch_name=$(git branch --show-current 2>/dev/null || echo "no-branch")
    
    # Combine all state indicators
    echo "${development_git_status}-${progress_content_hash}-${commit_hash}-${branch_name}" | sha256sum | cut -d' ' -f1
}

# Function to check if we need to update
should_update() {
    local current_hash=$(generate_state_hash)
    local last_hash=""
    
    if [ -f "$LAST_HASH_FILE" ]; then
        last_hash=$(cat "$LAST_HASH_FILE")
    fi
    
    # Special case: always update if action is not auto (manual calls)
    if [[ "$ACTION" != "auto" ]]; then
        echo "true"
        return
    fi
    
    # Check if there are any actual development file changes (not just cache/progress files)
    local development_changes=$(git status --porcelain | \
                              grep -v "PROGRESS.md" | \
                              grep -v ".progress-cache" | \
                              grep -v ".auto-progress" | \
                              grep -v ".progress-server.pid" | \
                              grep -v "progress.html" | \
                              grep -v "server.pid" | \
                              wc -l)
    
    # If no development changes and hash hasn't changed, skip
    if [[ $development_changes -eq 0 ]] && [[ "$current_hash" == "$last_hash" ]]; then
        echo -e "${GREEN}✅ No development changes detected - skipping update${NC}"
        echo "false"
        return
    fi
    
    # Check if PROGRESS.md was manually edited (newer than cache)
    if [ -f "$PROGRESS_FILE" ] && [ -f "$STATE_CACHE" ]; then
        if [ "$PROGRESS_FILE" -nt "$STATE_CACHE" ]; then
            echo -e "${YELLOW}📝 Manual edit detected in PROGRESS.md${NC}"
            echo "true"
            return
        fi
    fi
    
    # Check if hash changed
    if [[ "$current_hash" != "$last_hash" ]]; then
        echo -e "${CYAN}🔍 State change detected (hash: ${current_hash:0:8}...)${NC}"
        echo "true"
    else
        echo -e "${GREEN}✅ No changes detected - skipping update${NC}"
        echo "false"
    fi
}

# Function to cache current state
cache_current_state() {
    local current_hash=$(generate_state_hash)
    echo "$current_hash" > "$LAST_HASH_FILE"
    touch "$STATE_CACHE"
}

# Function to get cached github data
get_cached_github_data() {
    local issue_numbers=$(grep -o "#[0-9]\+" "$PROGRESS_FILE" 2>/dev/null | sort -u | tr '\n' ',' || echo "")
    local cache_key="issues-${issue_numbers}"
    local cache_file="$GITHUB_CACHE-${cache_key//[^a-zA-Z0-9]/_}"
    
    # Check if cache exists and is less than 10 minutes old
    if [ -f "$cache_file" ] && [ $(($(date +%s) - $(stat -c %Y "$cache_file" 2>/dev/null || echo 0))) -lt 600 ]; then
        echo -e "${GREEN}📋 Using cached GitHub data${NC}"
        cat "$cache_file"
        return 0
    fi
    
    echo -e "${YELLOW}🌐 Fetching fresh GitHub data...${NC}"
    
    # Extract issue numbers from PROGRESS.md
    local github_data=""
    if command -v gh >/dev/null 2>&1; then
        for issue_num in $(grep -o "#[0-9]\+" "$PROGRESS_FILE" 2>/dev/null | sed 's/#//' | sort -u); do
            local issue_info
            issue_info=$(gh issue view "$issue_num" --json title,state,url 2>/dev/null || echo "")
            if [[ -n "$issue_info" ]]; then
                github_data="${github_data}Issue #${issue_num}: ${issue_info}\n"
            fi
        done
    fi
    
    # Cache the result
    echo -e "$github_data" > "$cache_file"
    echo -e "$github_data"
}

# Function to get git commit information
get_git_commit_info() {
    local commit_hash=$(git rev-parse HEAD 2>/dev/null || echo "")
    local cache_key="commit-${commit_hash}"
    local cache_file="$COMMIT_CACHE-${cache_key//[^a-zA-Z0-9]/_}"
    
    # Check if we have this commit cached
    if [ -f "$cache_file" ]; then
        cat "$cache_file"
        return 0
    fi
    
    if [[ -n "$commit_hash" ]]; then
        local commit_info=$(git log -1 --pretty=format:"%H|%an|%ad|%s" --date=iso HEAD 2>/dev/null || echo "")
        if [[ -n "$commit_info" ]]; then
            echo "$commit_info" > "$cache_file"
            echo "$commit_info"
        fi
    fi
}

# Function to update git commit section in PROGRESS.md
update_git_commit_section() {
    local commit_info=$(get_git_commit_info)
    
    if [[ -z "$commit_info" ]]; then
        return 0
    fi
    
    IFS='|' read -r hash author date message <<< "$commit_info"
    local short_hash="${hash:0:8}"
    local formatted_date=$(date -d "$date" '+%Y-%m-%d %H:%M UTC' 2>/dev/null || echo "$date")
    
    # Check if Git Commit section exists
    if ! grep -q "### 🔗 Latest Git Commit" "$PROGRESS_FILE"; then
        # Add the section before "Recent Updates"
        local temp_file=$(mktemp)
        awk -v hash="$short_hash" -v author="$author" -v date="$formatted_date" -v msg="$message" '
        /^### 🔄 Recent Updates/ {
            print "### 🔗 Latest Git Commit"
            print "- **Hash**: `" hash "`"
            print "- **Author**: " author
            print "- **Date**: " date
            print "- **Message**: " msg
            print ""
            print $0
            next
        }
        { print }' "$PROGRESS_FILE" > "$temp_file"
        mv "$temp_file" "$PROGRESS_FILE"
    else
        # Update existing section - escape special characters
        escaped_author=$(echo "$author" | sed 's/[[\.*^$()+?{|]/\\&/g')
        escaped_message=$(echo "$message" | sed 's/[[\.*^$()+?{|]/\\&/g')
        sed -i "/### 🔗 Latest Git Commit/,/^### / {
            /- \*\*Hash\*\*:/ c\\- **Hash**: \`$short_hash\`
            /- \*\*Author\*\*:/ c\\- **Author**: $escaped_author
            /- \*\*Date\*\*:/ c\\- **Date**: $formatted_date
            /- \*\*Message\*\*:/ c\\- **Message**: $escaped_message
        }" "$PROGRESS_FILE"
    fi
}

# Enhanced change detection
detect_specific_changes() {
    local changes=""
    local untracked_files=$(git status --porcelain | grep "^??" | wc -l)
    local modified_files=$(git status --porcelain | grep "^ M" | grep -v "PROGRESS.md" | wc -l)
    local staged_files=$(git status --porcelain | grep "^M " | wc -l)
    
    # Check for specific file types
    local test_files=$(git status --porcelain | grep -E "\.(test|spec)\.(ts|tsx|js|jsx)$" | wc -l)
    local hook_files=$(git status --porcelain | grep "hooks/" | wc -l)
    local component_files=$(git status --porcelain | grep "components/" | wc -l)
    
    if [[ $test_files -gt 0 ]]; then
        changes="test-development"
    elif [[ $hook_files -gt 0 ]]; then
        changes="hook-development"
    elif [[ $component_files -gt 0 ]]; then
        changes="component-development"
    elif [[ $staged_files -gt 0 ]]; then
        changes="staged-changes"
    elif [[ $modified_files -gt 0 ]]; then
        changes="file-modifications"
    elif [[ $untracked_files -gt 0 ]]; then
        changes="new-files"
    else
        changes="no-changes"
    fi
    
    echo "$changes"
}

# Function to generate intelligent description
generate_smart_description() {
    local change_type=$(detect_specific_changes)
    local description=""
    
    case "$change_type" in
        "test-development")
            # Check if it's specifically useSessionMachine test
            if git status --porcelain | grep -q "useSessionMachine.test"; then
                # Check if this is a repeat (avoid duplicate messages)
                if grep -q "useSessionMachine test file" "$PROGRESS_FILE" | tail -3 | grep -q "$(date -u '+%Y-%m-%d')"; then
                    description="Continued development on useSessionMachine test suite"
                else
                    description="Advanced TDD development on useSessionMachine hook"
                fi
            else
                description="Test-driven development progress on React components"
            fi
            ;;
        "hook-development")
            description="Custom React hooks implementation and refinement"
            ;;
        "component-development")
            description="React component development and optimization"
            ;;
        "staged-changes")
            description="Code changes staged for commit"
            ;;
        "file-modifications")
            description="Active development and file modifications"
            ;;
        "new-files")
            description="New development artifacts created"
            ;;
        *)
            description="Development environment status check"
            ;;
    esac
    
    echo "$description"
}

# Ensure PROGRESS.md exists
if [ ! -f "$PROGRESS_FILE" ]; then
    echo -e "${RED}❌ PROGRESS.md not found in current directory${NC}"
    exit 1
fi

# Check if we should update
if [[ "$(should_update)" == "false" ]]; then
    exit 0
fi

echo -e "${PURPLE}🚀 Processing smart update...${NC}"

# Create timestamp
TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M UTC')

# Function to detect current feature being worked on  
detect_current_feature() {
    local feature="unknown"
    
    # Check untracked files for clues
    if git status --porcelain | grep -q "useSessionMachine"; then
        feature="session-timer"
    elif git status --porcelain | grep -q "session"; then
        feature="session-timer"
    elif git status --porcelain | grep -q "timer"; then
        feature="session-timer"
    elif git status --porcelain | grep -q "hooks/"; then
        feature="session-timer"
    elif git status --porcelain | grep -q "components/"; then
        feature="components"
    fi
    
    echo "$feature"
}

# Function to count files by type
count_files() {
    local type="$1"
    local count=0
    
    case "$type" in
        "tests")
            count=$(find src/web/src/__tests__ -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l || echo 0)
            ;;
        "components")
            count=$(find src/web/src/components -name "*.tsx" 2>/dev/null | wc -l || echo 0)
            ;;
        "hooks")
            count=$(find src/web/src/hooks -name "*.ts" 2>/dev/null | wc -l || echo 0)
            ;;
        "created")
            count=$(git status --porcelain | grep "^??" | wc -l)
            ;;
        "modified")
            count=$(git status --porcelain | grep "^ M" | grep -v "PROGRESS.md" | grep -v ".progress-server.pid" | wc -l)
            ;;
    esac
    
    echo "$count"
}

# Function to update the Recent Updates section
update_recent_updates() {
    local new_entry="- [x] $DESCRIPTION ($TIMESTAMP)"
    
    # Create a temporary file
    local temp_file=$(mktemp)
    
    # Read the file and add new entry after "### 🔄 Recent Updates"
    awk -v new_entry="$new_entry" '
    /^### 🔄 Recent Updates/ {
        print $0
        print new_entry
        next
    }
    { print }
    ' "$PROGRESS_FILE" > "$temp_file"
    
    # Replace original file
    mv "$temp_file" "$PROGRESS_FILE"
}

# Function to update quality metrics
update_quality_metrics() {
    local tests_count
    local components_count
    local created_count
    local modified_count
    
    tests_count=$(count_files "tests")
    components_count=$(count_files "components")
    created_count=$(count_files "created")
    modified_count=$(count_files "modified")
    
    # Update metrics in the file using more robust sed patterns
    sed -i "s/- \*\*Tests Written\*\*: [0-9]\+/- **Tests Written**: $tests_count/" "$PROGRESS_FILE"
    sed -i "s/- \*\*Components Created\*\*: [0-9]\+/- **Components Created**: $components_count/" "$PROGRESS_FILE"
    sed -i "s/- \*\*Files Created\*\*: [0-9]\+/- **Files Created**: $created_count/" "$PROGRESS_FILE"
    sed -i "s/- \*\*Files Modified\*\*: [0-9]\+/- **Files Modified**: $modified_count/" "$PROGRESS_FILE"
}

# Function to update timestamp
update_timestamp() {
    sed -i "s/\*\*Last Updated\*\*: .*/\*\*Last Updated\*\*: $TIMESTAMP/" "$PROGRESS_FILE"
}

# Auto-detect feature and description if not provided
if [[ "$ACTION" == "auto" ]]; then
    if [[ -z "$FEATURE_NAME" ]]; then
        FEATURE_NAME=$(detect_current_feature)
        echo -e "${YELLOW}📍 Auto-detected feature: $FEATURE_NAME${NC}"
    fi
    
    if [[ -z "$DESCRIPTION" ]]; then
        DESCRIPTION=$(generate_smart_description)
        echo -e "${YELLOW}📝 Smart-generated description: $DESCRIPTION${NC}"
    fi
fi

# Function to add section to PROGRESS.md (enhanced)
add_progress_entry() {
    local status_icon=""
    
    case "$ACTION" in
        "testing"|"test")
            status_icon="🧪"
            ;;
        "complete"|"completed")
            status_icon="✅"
            ;;
        "blocked"|"block")
            status_icon="🚫"
            ;;
        "working"|"wip")
            status_icon="🔧"
            ;;
        "phase1")
            status_icon="🔧"
            ;;
        "phase2")
            status_icon="🎯"
            ;;
        "phase3")
            status_icon="📊"
            ;;
        "phase4")
            status_icon="💾"
            ;;
        *)
            status_icon="🔄"
            ;;
    esac
    
    # Add entry at the end of the file
    cat >> "$PROGRESS_FILE" << EOF

### $status_icon $(echo "${ACTION^}") - $TIMESTAMP
**Feature**: $FEATURE_NAME
**Action**: $DESCRIPTION
**Status**: $status_icon $(echo "${ACTION^}")

EOF
}

# Main execution
echo -e "${BLUE}🔍 Analyzing current development status...${NC}"

# Update Git Commit section first
echo -e "${YELLOW}🔗 Updating git commit information...${NC}"
update_git_commit_section

# Update Recent Updates section
echo -e "${YELLOW}📝 Updating Recent Updates section...${NC}"
update_recent_updates

# Update quality metrics
echo -e "${YELLOW}📊 Updating quality metrics...${NC}"
update_quality_metrics

# Update timestamp
echo -e "${YELLOW}⏰ Updating timestamp...${NC}"
update_timestamp

# Add progress entry if specific action provided
if [[ "$ACTION" != "auto" ]]; then
    echo -e "${YELLOW}📋 Adding progress entry...${NC}"
    add_progress_entry
fi

# Cache current state after successful update
cache_current_state

echo -e "${GREEN}✅ Smart update completed successfully!${NC}"

# Show summary of changes
echo -e "\n${BLUE}📊 Update Summary:${NC}"
echo -e "  ${YELLOW}Feature:${NC} $FEATURE_NAME"
echo -e "  ${YELLOW}Description:${NC} $DESCRIPTION"
echo -e "  ${YELLOW}Timestamp:${NC} $TIMESTAMP"
echo -e "  ${YELLOW}State Hash:${NC} $(generate_state_hash | cut -c1-8)..."

# Show current git status (only if changes exist)
git_changes=$(git status --porcelain | wc -l)
if [[ $git_changes -gt 0 ]]; then
    echo -e "\n${BLUE}📁 Current Git Status:${NC}"
    git status --short
fi

# Show file changes analysis (only for manual actions)
if [[ "$ACTION" != "auto" ]]; then
    echo -e "\n${BLUE}📄 File Changes Analysis:${NC}"
    # Show only if there are actual changes
    has_changes=false
    echo "**Created Files:**"
    while IFS= read -r line; do
        if [[ $line == "?? "* ]]; then
            file=$(echo "$line" | cut -c4-)
            echo "- 🆕 \`$file\`"
            has_changes=true
        fi
    done < <(git status --porcelain)
    
    if [[ "$has_changes" == false ]]; then
        echo "- No new files"
    fi
fi

# Commit if requested
if [[ "$COMMIT_FLAG" == "--commit" ]]; then
    echo -e "\n${BLUE}💾 Committing changes...${NC}"
    git add PROGRESS.md
    git commit -m "docs: update progress tracking - $DESCRIPTION

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    echo -e "${GREEN}✅ Changes committed successfully!${NC}"
fi

echo -e "\n${GREEN}🎯 Smart progress update complete!${NC}"