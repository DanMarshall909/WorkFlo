#!/bin/bash

# analyze-code-context.sh - Automated code quality analysis with issue creation
# Usage: ./scripts/analyze-code-context.sh [--auto-create-issues] [--target-file <file>]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
    echo -e "${BLUE}[CODE-ANALYSIS]${NC} $1"
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

# Configuration
AUTO_CREATE_ISSUES="false"
TARGET_FILE=""
ANALYSIS_RESULTS=()

# Security patterns to detect
SECURITY_PATTERNS=(
    "password.*=.*[\"'][^\"']*[\"']"
    "api.*key.*=.*[\"'][^\"']*[\"']"
    "secret.*=.*[\"'][^\"']*[\"']"
    "connectionstring.*=.*[\"'][^\"']*[\"']"
    "SELECT.*\+.*WHERE"  # Potential SQL injection
    "innerHTML.*=.*\+"   # Potential XSS
    "eval\("            # Dangerous eval usage
)

# Performance patterns to detect
PERFORMANCE_PATTERNS=(
    "for.*for.*for"      # Nested loops (potential O(n³))
    "await.*for"         # Await in loop (sequential processing)
    "\.ToList\(\)\.Count" # LINQ inefficiency
    "string.*\+.*for"    # String concatenation in loop
    "new.*\(\).*for"     # Object creation in loop
)

# Architecture patterns to detect
ARCHITECTURE_PATTERNS=(
    "class.*: .*{.*class.*:"  # God classes
    "new [A-Z][a-zA-Z]*Service\(\)" # Direct service instantiation
    "if.*else.*if.*else.*if" # Complex conditional logic
    "try.*catch.*catch"      # Multiple catch blocks
)

# Code quality patterns to detect
QUALITY_PATTERNS=(
    "magic.*number|[0-9]{2,}" # Magic numbers
    "TODO|FIXME|HACK"         # Technical debt markers
    "Console\.WriteLine"      # Debug/logging issues
    "Thread\.Sleep"           # Blocking operations
    "\.Result"               # Blocking async operations
)

# Analyze a single file for issues
analyze_file() {
    local file_path="$1"
    local issues_found=()
    
    if [[ ! -f "$file_path" ]]; then
        return 0
    fi
    
    log "Analyzing: $file_path"
    
    # Check security issues
    for pattern in "${SECURITY_PATTERNS[@]}"; do
        local matches
        matches=$(grep -n -i "$pattern" "$file_path" 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
            issues_found+=("SECURITY:$pattern:$matches")
        fi
    done
    
    # Check performance issues
    for pattern in "${PERFORMANCE_PATTERNS[@]}"; do
        local matches
        matches=$(grep -n -E "$pattern" "$file_path" 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
            issues_found+=("PERFORMANCE:$pattern:$matches")
        fi
    done
    
    # Check architecture issues
    for pattern in "${ARCHITECTURE_PATTERNS[@]}"; do
        local matches
        matches=$(grep -n -E "$pattern" "$file_path" 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
            issues_found+=("ARCHITECTURE:$pattern:$matches")
        fi
    done
    
    # Check code quality issues
    for pattern in "${QUALITY_PATTERNS[@]}"; do
        local matches
        matches=$(grep -n -E "$pattern" "$file_path" 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
            issues_found+=("QUALITY:$pattern:$matches")
        fi
    done
    
    # Store results
    for issue in "${issues_found[@]}"; do
        ANALYSIS_RESULTS+=("$file_path:$issue")
    done
    
    if [[ ${#issues_found[@]} -gt 0 ]]; then
        warn "Found ${#issues_found[@]} potential issues in $file_path"
    fi
}

# Analyze changed files in current git repository
analyze_changed_files() {
    log "Analyzing changed files in current branch..."
    
    # Get list of changed files
    local changed_files
    changed_files=$(git diff --name-only HEAD~1 2>/dev/null || git ls-files --others --exclude-standard)
    
    if [[ -z "$changed_files" ]]; then
        log "No changed files detected"
        return 0
    fi
    
    # Analyze each changed file
    while IFS= read -r file; do
        if [[ -f "$file" && "$file" =~ \.(cs|ts|tsx|js|jsx)$ ]]; then
            analyze_file "$file"
        fi
    done <<< "$changed_files"
}

# Create issues for detected problems
create_issues_for_problems() {
    if [[ ${#ANALYSIS_RESULTS[@]} -eq 0 ]]; then
        success "No issues detected - code quality looks good!"
        return 0
    fi
    
    log "Processing ${#ANALYSIS_RESULTS[@]} detected issues..."
    
    # Group issues by type and file
    declare -A issue_groups
    
    for result in "${ANALYSIS_RESULTS[@]}"; do
        IFS=':' read -r file_path category pattern matches <<< "$result"
        local key="${category}:${file_path}"
        if [[ -z "${issue_groups[$key]:-}" ]]; then
            issue_groups["$key"]="$pattern"
        else
            issue_groups["$key"]="${issue_groups[$key]}, $pattern"
        fi
    done
    
    # Create issues for each group
    for key in "${!issue_groups[@]}"; do
        IFS=':' read -r category file_path <<< "$key"
        local patterns="${issue_groups[$key]}"
        
        local title="[$category] Issues in $(basename "$file_path")"
        local description="Detected ${category,,} issues in $file_path:\n\nPatterns found: $patterns\n\nThis requires review and potential refactoring."
        local keywords="${category,,},code-quality,technical-debt"
        
        if [[ "$AUTO_CREATE_ISSUES" == "true" ]]; then
            log "Creating issue for $category issues in $file_path..."
            
            # Use our duplicate-checking issue creator
            if "$SCRIPT_DIR/create-quality-issue.sh" "$title" "$description" "$keywords" 2>/dev/null; then
                success "Created quality issue for $file_path"
            else
                warn "Issue creation skipped (duplicate found or failed)"
            fi
        else
            warn "Issue detected: $title"
            echo "  Description: $description"
            echo "  Keywords: $keywords"
            echo "  Use --auto-create-issues to create GitHub issues automatically"
        fi
    done
}

# Suggest future features based on code analysis
suggest_future_features() {
    log "Analyzing codebase for future feature opportunities..."
    
    # Look for common patterns that suggest missing features
    local suggestions=()
    
    # Check for validation patterns
    if grep -r "validate\|validation" src/ 2>/dev/null | grep -v test | wc -l | awk '{if($1 > 5) print "true"}' | grep -q true; then
        suggestions+=("Centralized validation framework - Multiple validation patterns detected")
    fi
    
    # Check for configuration patterns
    if grep -r "appsettings\|config\|configuration" src/ 2>/dev/null | wc -l | awk '{if($1 > 10) print "true"}' | grep -q true; then
        suggestions+=("Advanced configuration management - Multiple config access points detected")
    fi
    
    # Check for logging patterns
    if grep -r "log\|Log" src/ 2>/dev/null | grep -v test | wc -l | awk '{if($1 > 15) print "true"}' | grep -q true; then
        suggestions+=("Structured logging enhancement - Extensive logging usage detected")
    fi
    
    # Check for HTTP client patterns
    if grep -r "HttpClient\|http" src/ 2>/dev/null | wc -l | awk '{if($1 > 5) print "true"}' | grep -q true; then
        suggestions+=("HTTP client resilience patterns - Multiple HTTP calls detected")
    fi
    
    # Output suggestions
    if [[ ${#suggestions[@]} -gt 0 ]]; then
        echo ""
        log "🚀 Future Feature Suggestions:"
        for suggestion in "${suggestions[@]}"; do
            echo "  - $suggestion"
        done
        
        # Write to future features file
        echo "# Future Features (Generated $(date))" > FUTURE-FEATURES.md
        for suggestion in "${suggestions[@]}"; do
            echo "- $suggestion" >> FUTURE-FEATURES.md
        done
        log "Suggestions written to FUTURE-FEATURES.md"
    fi
}

# Show help
show_help() {
    echo "Automated Code Quality Analysis"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --auto-create-issues    Automatically create GitHub issues for detected problems"
    echo "  --target-file <file>    Analyze specific file instead of changed files"
    echo "  --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Analyze changed files, report only"
    echo "  $0 --auto-create-issues              # Analyze and create GitHub issues"
    echo "  $0 --target-file src/service.cs      # Analyze specific file"
    echo ""
    echo "Integration with existing workflow:"
    echo "  This script is automatically called during TDD phases to detect"
    echo "  quality issues and suggest improvements."
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-create-issues)
            AUTO_CREATE_ISSUES="true"
            shift
            ;;
        --target-file)
            TARGET_FILE="$2"
            shift 2
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Check dependencies
if ! command -v git &> /dev/null; then
    error "Git is required but not installed"
fi

if ! command -v grep &> /dev/null; then
    error "Grep is required but not installed"
fi

# Main execution
log "Starting code quality analysis..."

if [[ -n "$TARGET_FILE" ]]; then
    analyze_file "$TARGET_FILE"
else
    analyze_changed_files
fi

create_issues_for_problems
suggest_future_features

if [[ ${#ANALYSIS_RESULTS[@]} -eq 0 ]]; then
    success "Code analysis complete - no issues detected!"
else
    warn "Code analysis complete - ${#ANALYSIS_RESULTS[@]} potential issues found"
    
    if [[ "$AUTO_CREATE_ISSUES" == "false" ]]; then
        echo ""
        echo "💡 Tip: Use --auto-create-issues to automatically create GitHub issues for tracking"
    fi
fi