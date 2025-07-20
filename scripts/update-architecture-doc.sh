#!/bin/bash

# Update Architectural Summary Documentation
# This script helps maintain the architectural summary document

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ARCH_FILE="$ROOT_DIR/docs/architectural-summary.md"

# Color functions
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_info() { echo -e "\033[36mℹ️  $1\033[0m"; }
print_header() { 
    echo ""
    echo -e "\033[34m🏗️ $1\033[0m"
    echo -e "\033[34m$(printf '=%.0s' {1..80})\033[0m"
}

show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Update the architectural summary documentation for the WorkFlo project.

OPTIONS:
    --check         Check if architectural documentation needs updates
    --update        Update placeholders and metadata in the documentation
    --analyze       Analyze recent changes and suggest documentation updates
    --help, -h      Show this help message

EXAMPLES:
    $0 --check      # Check documentation status
    $0 --update     # Update timestamps and version info
    $0 --analyze    # Analyze code changes for doc updates
    $0              # Run all operations (default)

The architectural summary is located at: docs/architectural-summary.md
EOF
}

check_architecture_doc() {
    print_header "Checking Architectural Documentation"
    
    if [ ! -f "$ARCH_FILE" ]; then
        print_error "Architectural summary not found at $ARCH_FILE"
        print_info "Run the following to create it:"
        print_info "  mkdir -p docs"
        print_info "  # Create architectural-summary.md with proper content"
        return 1
    fi
    
    print_success "Architectural summary found"
    
    # Check for placeholder content
    if grep -q "{UPDATE_DATE}" "$ARCH_FILE"; then
        print_warning "Found unresolved UPDATE_DATE placeholder"
    fi
    
    if grep -q "{VERSION}" "$ARCH_FILE"; then
        print_warning "Found unresolved VERSION placeholder"  
    fi
    
    # Check file age
    local file_age_days=$(( ($(date +%s) - $(stat -c %Y "$ARCH_FILE")) / 86400 ))
    if [ "$file_age_days" -gt 30 ]; then
        print_warning "Architecture document is $file_age_days days old - consider reviewing"
    else
        print_info "Architecture document was updated $file_age_days days ago"
    fi
    
    return 0
}

update_placeholders() {
    print_header "Updating Documentation Metadata"
    
    if [ ! -f "$ARCH_FILE" ]; then
        print_error "Cannot update - architectural summary not found"
        return 1
    fi
    
    local current_date=$(date '+%B %d, %Y')
    local current_version=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    # Create backup
    cp "$ARCH_FILE" "$ARCH_FILE.backup"
    
    # Update placeholders
    sed -i "s/{UPDATE_DATE}/$current_date/g" "$ARCH_FILE"
    sed -i "s/{VERSION}/$current_version/g" "$ARCH_FILE"
    
    print_success "Updated documentation metadata"
    print_info "  Date: $current_date"
    print_info "  Version: $current_version"
    print_info "  Backup: $ARCH_FILE.backup"
}

analyze_changes() {
    print_header "Analyzing Recent Changes"
    
    cd "$ROOT_DIR"
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_warning "Not in a git repository - cannot analyze changes"
        return 0
    fi
    
    # Check for significant changes since last commit
    local changed_files=()
    
    # Domain changes
    mapfile -t domain_changes < <(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E "src/.*/Domain/.*\.cs$" || true)
    
    # Application layer changes  
    mapfile -t app_changes < <(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E "src/.*/Application/.*\.cs$" || true)
    
    # Infrastructure changes
    mapfile -t infra_changes < <(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E "src/.*/Infrastructure/.*\.cs$" || true)
    
    # API changes
    mapfile -t api_changes < <(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E "src/.*/Api/.*\.cs$" || true)
    
    # Configuration changes
    mapfile -t config_changes < <(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E ".*\.(csproj|sln|json)$" || true)
    
    local has_changes=false
    
    if [ ${#domain_changes[@]} -gt 0 ]; then
        has_changes=true
        print_warning "Domain layer changes detected:"
        printf '   - %s\n' "${domain_changes[@]}"
        echo "  📝 Consider updating:"
        echo "     - Domain model diagrams"
        echo "     - Aggregate descriptions"
        echo "     - Business rules documentation"
        echo ""
    fi
    
    if [ ${#app_changes[@]} -gt 0 ]; then
        has_changes=true
        print_warning "Application layer changes detected:"
        printf '   - %s\n' "${app_changes[@]}"
        echo "  📝 Consider updating:"
        echo "     - CQRS command/query documentation"
        echo "     - Handler descriptions"
        echo "     - Validation rules"
        echo ""
    fi
    
    if [ ${#infra_changes[@]} -gt 0 ]; then
        has_changes=true
        print_warning "Infrastructure layer changes detected:"
        printf '   - %s\n' "${infra_changes[@]}"
        echo "  📝 Consider updating:"
        echo "     - Database schema documentation"
        echo "     - External service integrations"
        echo "     - Repository implementations"
        echo ""
    fi
    
    if [ ${#api_changes[@]} -gt 0 ]; then
        has_changes=true
        print_warning "API layer changes detected:"
        printf '   - %s\n' "${api_changes[@]}"
        echo "  📝 Consider updating:"
        echo "     - Endpoint documentation"
        echo "     - API contract descriptions"
        echo "     - Request/response examples"
        echo ""
    fi
    
    if [ ${#config_changes[@]} -gt 0 ]; then
        has_changes=true
        print_warning "Configuration changes detected:"
        printf '   - %s\n' "${config_changes[@]}"
        echo "  📝 Consider updating:"
        echo "     - Technology stack section"
        echo "     - Dependency information"
        echo "     - Build/deployment notes"
        echo ""
    fi
    
    if [ "$has_changes" = false ]; then
        print_success "No significant architectural changes detected"
    else
        echo ""
        print_info "💡 To update the architectural summary:"
        print_info "   1. Review the detected changes above"
        print_info "   2. Edit docs/architectural-summary.md"
        print_info "   3. Update relevant sections with new information"
        print_info "   4. Add/modify Mermaid diagrams if needed"
        print_info "   5. Update tips, traps, or best practices sections"
    fi
}

generate_change_summary() {
    print_header "Generating Change Summary"
    
    local summary_file="$ROOT_DIR/reports/architecture-changes.md"
    mkdir -p "$(dirname "$summary_file")"
    
    cat > "$summary_file" << EOF
# Architecture Change Summary
Generated: $(date)
Repository: $(git remote get-url origin 2>/dev/null || echo "Local repository")
Commit: $(git rev-parse HEAD 2>/dev/null || echo "Unknown")

## Recent Changes Analysis

$(cd "$ROOT_DIR" && ./scripts/update-architecture-doc.sh --analyze 2>&1 | sed 's/\x1b\[[0-9;]*m//g')

## Recommended Actions

- [ ] Review domain model changes for accuracy
- [ ] Update CQRS patterns documentation
- [ ] Verify technology stack is current
- [ ] Add new architectural decisions to tips section
- [ ] Update Mermaid diagrams if structure changed
- [ ] Review and update external links for relevance

## Files to Check

- docs/architectural-summary.md
- docs/domain-glossary.md
- README.md

---
Generated by: scripts/update-architecture-doc.sh
EOF
    
    print_success "Change summary saved to: $summary_file"
}

# Main execution
main() {
    local check_only=false
    local update_only=false
    local analyze_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check)
                check_only=true
                shift
                ;;
            --update)
                update_only=true
                shift
                ;;
            --analyze)
                analyze_only=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Execute based on arguments
    if [ "$check_only" = true ]; then
        check_architecture_doc
    elif [ "$update_only" = true ]; then
        update_placeholders
    elif [ "$analyze_only" = true ]; then
        analyze_changes
    else
        # Run all operations (default)
        check_architecture_doc
        update_placeholders  
        analyze_changes
        generate_change_summary
    fi
}

main "$@"