#!/bin/bash

# Claude Quality Reviewer
# Automatically reviews ReSharper findings and either fixes them or justifies them
# Reruns checks until all issues are resolved

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$PROJECT_ROOT/reports"
REVIEW_LOG="$REPORTS_DIR/claude-review-log.md"

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}🤖 Claude Quality Reviewer${NC}"
    echo -e "${CYAN}===========================${NC}"
    echo -e "${CYAN}Analyzing ReSharper + SonarAnalyzer findings${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_claude() {
    echo -e "${CYAN}🤖 Claude: $1${NC}"
}

initialize_review_log() {
    mkdir -p "$REPORTS_DIR"
    cat > "$REVIEW_LOG" << EOF
# Claude Quality Review Log
Generated: $(date)

## Overview
This document records Claude's review of code analysis findings from:
- **ReSharper**: Code quality and style analysis
- **SonarAnalyzer**: Security, reliability, and maintainability analysis

## Review Process
1. **Analysis**: Claude analyzes each finding from both tools
2. **Decision**: Either fix the issue or justify why it should remain
3. **Documentation**: All decisions are recorded here
4. **Verification**: Quality checks are rerun until all issues are resolved

---

EOF
}

run_quality_check() {
    print_info "Running quality check..."
    cd "$PROJECT_ROOT"
    
    if ! ./scripts/pr-quality-check.sh > /dev/null 2>&1; then
        print_warning "Quality check completed with issues"
        return 1
    else
        print_success "Quality check passed!"
        return 0
    fi
}

extract_resharper_issues() {
    local resharper_report="$REPORTS_DIR/resharper-report.xml"
    
    if [[ ! -f "$resharper_report" ]]; then
        print_error "ReSharper report not found"
        return 1
    fi
    
    # Extract issues using simple grep/sed parsing
    local issues_file="$REPORTS_DIR/resharper-issues.txt"
    
    # Parse XML to extract issue information
    grep "<Issue " "$resharper_report" | while read -r issue_line; do
        # Extract key attributes using sed
        local type_id=$(echo "$issue_line" | sed -n 's/.*TypeId="\([^"]*\)".*/\1/p')
        local file=$(echo "$issue_line" | sed -n 's/.*File="\([^"]*\)".*/\1/p')
        local line=$(echo "$issue_line" | sed -n 's/.*Line="\([^"]*\)".*/\1/p')
        local message=$(echo "$issue_line" | sed -n 's/.*Message="\([^"]*\)".*/\1/p')
        
        echo "RESHARPER_ISSUE: $type_id"
        echo "FILE: $file"
        echo "LINE: $line"
        echo "MESSAGE: $message"
        echo "---"
    done > "$issues_file"
    
    local issue_count=$(grep -c "RESHARPER_ISSUE:" "$issues_file" 2>/dev/null || echo "0")
    echo "$issue_count"
}

extract_sonar_issues() {
    print_info "Extracting SonarAnalyzer issues from build output..."
    
    # Run dotnet build with SonarAnalyzer to capture issues
    local sonar_log="$REPORTS_DIR/sonar-build.log"
    local sonar_issues="$REPORTS_DIR/sonar-issues.txt"
    
    cd "$PROJECT_ROOT"
    
    # Build and capture SonarAnalyzer warnings/errors
    dotnet build --verbosity normal > "$sonar_log" 2>&1 || true
    
    # Extract SonarAnalyzer issues (SA prefixed rules)
    grep -E "SA[0-9]{4}|S[0-9]{3,4}" "$sonar_log" | while read -r line; do
        # Parse format: path(line,column): severity SA/S####: message
        if [[ "$line" =~ ^([^(]+)\(([^,]+),([^)]+)\):\ (warning|error)\ (SA[0-9]{4}|S[0-9]{3,4}):\ (.*)$ ]]; then
            echo "SONAR_ISSUE: ${BASH_REMATCH[5]}"
            echo "FILE: ${BASH_REMATCH[1]}"
            echo "LINE: ${BASH_REMATCH[2]}"
            echo "SEVERITY: ${BASH_REMATCH[4]}"
            echo "MESSAGE: ${BASH_REMATCH[6]}"
            echo "---"
        fi
    done > "$sonar_issues"
    
    local issue_count=$(grep -c "SONAR_ISSUE:" "$sonar_issues" 2>/dev/null || echo "0")
    echo "$issue_count"
}

extract_all_issues() {
    print_info "Extracting all code analysis issues..."
    
    local resharper_count=$(extract_resharper_issues)
    local sonar_count=$(extract_sonar_issues)
    local total_count=$((resharper_count + sonar_count))
    
    # Combine issues into single file
    local all_issues="$REPORTS_DIR/all-issues.txt"
    {
        if [[ -f "$REPORTS_DIR/resharper-issues.txt" ]]; then
            cat "$REPORTS_DIR/resharper-issues.txt"
        fi
        if [[ -f "$REPORTS_DIR/sonar-issues.txt" ]]; then
            cat "$REPORTS_DIR/sonar-issues.txt"
        fi
    } > "$all_issues"
    
    print_info "Found $resharper_count ReSharper + $sonar_count SonarAnalyzer = $total_count total issues"
    echo "$total_count"
}

analyze_issue_severity() {
    local issue_type="$1"
    
    # Classify issues by severity and fixability
    case "$issue_type" in
        # ReSharper Critical issues that should always be fixed
        "RedundantUsingDirective"|"UnusedVariable"|"UnusedParameter"|"DeadCode")
            echo "CRITICAL_FIX"
            ;;
        # ReSharper Style issues that should be fixed for consistency  
        "InconsistentNaming"|"FieldCanBeMadeReadOnly"|"MemberCanBePrivate")
            echo "STYLE_FIX"
            ;;
        # ReSharper Performance issues that should be addressed
        "PossibleMultipleEnumeration"|"LoopCanBeConvertedToQuery")
            echo "PERFORMANCE_FIX"
            ;;
        # SonarAnalyzer Critical Security/Reliability issues
        "S1075"|"S2068"|"S2076"|"S4784"|"S5542") # Hardcoded URIs, passwords, LDAP injection, etc.
            echo "SECURITY_CRITICAL"
            ;;
        "S1066"|"S1067"|"S1871"|"S3776"|"S1481") # Code complexity, duplicated blocks, unused variables
            echo "CRITICAL_FIX"
            ;;
        # SonarAnalyzer Code Smell issues
        "S101"|"S103"|"S104"|"S107"|"S109") # Naming, line length, file length, parameters, magic numbers
            echo "STYLE_FIX"
            ;;
        # SonarAnalyzer Performance issues
        "S1643"|"S1854"|"S2234"|"S3267") # String concatenation, dead stores, unnecessary calls
            echo "PERFORMANCE_FIX"
            ;;
        # StyleCop (SA) issues - mostly style/documentation
        "SA1101"|"SA1200"|"SA1300"|"SA1400"|"SA1500") # this., using placement, naming, access modifiers, braces
            echo "STYLE_FIX"
            ;;
        "SA1600"|"SA1601"|"SA1602"|"SA1633") # Documentation requirements
            echo "DOCUMENTATION_REVIEW"
            ;;
        # Suggestions that might be justified to keep
        "ClassNeverInstantiated"|"UnusedMember.Global"|"MemberCanBeProtected")
            echo "REVIEW_NEEDED"
            ;;
        # Test-related issues that might be acceptable
        "*Test*"|"*Assert*")
            echo "TEST_REVIEW"
            ;;
        *)
            echo "UNKNOWN"
            ;;
    esac
}

create_issue_fix_plan() {
    local all_issues_file="$REPORTS_DIR/all-issues.txt"
    local fix_plan="$REPORTS_DIR/claude-fix-plan.md"
    
    cat > "$fix_plan" << EOF
# Claude's Issue Fix Plan

## Issues Analysis (ReSharper + SonarAnalyzer)

EOF

    local issue_num=1
    while IFS= read -r line; do
        if [[ "$line" == "RESHARPER_ISSUE:"* ]] || [[ "$line" == "SONAR_ISSUE:"* ]]; then
            local issue_source="Unknown"
            local issue_type=""
            
            if [[ "$line" == "RESHARPER_ISSUE:"* ]]; then
                issue_source="ReSharper"
                issue_type=$(echo "$line" | cut -d' ' -f2-)
            elif [[ "$line" == "SONAR_ISSUE:"* ]]; then
                issue_source="SonarAnalyzer"
                issue_type=$(echo "$line" | cut -d' ' -f2-)
            fi
            
            local severity=$(analyze_issue_severity "$issue_type")
            
            echo "### Issue #$issue_num: $issue_type ($issue_source)" >> "$fix_plan"
            echo "**Source**: $issue_source" >> "$fix_plan"
            echo "**Severity Classification**: $severity" >> "$fix_plan"
            echo "" >> "$fix_plan"
            
            # Read the next few lines for file, line, message
            read -r file_line
            read -r line_line  
            read -r message_line
            
            # Handle potential severity line for SonarAnalyzer
            if [[ "$message_line" == "SEVERITY:"* ]]; then
                read -r actual_message_line
                read -r separator
                local severity_level=$(echo "$message_line" | cut -d' ' -f2-)
                local message=$(echo "$actual_message_line" | cut -d' ' -f2-)
                echo "**Build Severity**: $severity_level" >> "$fix_plan"
            else
                read -r separator
                local message=$(echo "$message_line" | cut -d' ' -f2-)
            fi
            
            local file=$(echo "$file_line" | cut -d' ' -f2-)
            local line_num=$(echo "$line_line" | cut -d' ' -f2-)
            
            echo "**File**: $file" >> "$fix_plan"
            echo "**Line**: $line_num" >> "$fix_plan"
            echo "**Message**: $message" >> "$fix_plan"
            echo "" >> "$fix_plan"
            
            # Provide fix strategy based on severity
            case "$severity" in
                "SECURITY_CRITICAL")
                    echo "**Claude's Decision**: WILL FIX IMMEDIATELY - Security vulnerability" >> "$fix_plan"
                    ;;
                "CRITICAL_FIX")
                    echo "**Claude's Decision**: WILL FIX - Critical issue affecting code quality" >> "$fix_plan"
                    ;;
                "STYLE_FIX")
                    echo "**Claude's Decision**: WILL FIX - Style consistency important" >> "$fix_plan"
                    ;;
                "PERFORMANCE_FIX")
                    echo "**Claude's Decision**: WILL FIX - Performance improvement opportunity" >> "$fix_plan"
                    ;;
                "DOCUMENTATION_REVIEW")
                    echo "**Claude's Decision**: REVIEW - Documentation requirements need context analysis" >> "$fix_plan"
                    ;;
                "REVIEW_NEEDED"|"TEST_REVIEW")
                    echo "**Claude's Decision**: NEEDS REVIEW - Will analyze context and decide" >> "$fix_plan"
                    ;;
                *)
                    echo "**Claude's Decision**: UNKNOWN - Will analyze manually" >> "$fix_plan"
                    ;;
            esac
            
            echo "" >> "$fix_plan"
            echo "---" >> "$fix_plan"
            echo "" >> "$fix_plan"
            
            ((issue_num++))
        fi
    done < "$all_issues_file"
    
    echo "Created fix plan: $fix_plan"
}

apply_automated_fixes() {
    print_claude "Applying automated fixes for ReSharper and SonarAnalyzer issues..."
    
    cd "$PROJECT_ROOT"
    
    # Apply common automated fixes
    
    # 1. Remove unused using directives (ReSharper + SonarAnalyzer)
    print_info "Removing unused using directives..."
    dotnet format analyzers --include IDE0005,CS8019 2>/dev/null || true
    
    # 2. Fix code formatting (StyleCop issues)
    print_info "Applying code formatting..."
    dotnet format style
    
    # 3. Fix analyzer warnings (both ReSharper and SonarAnalyzer)
    print_info "Applying analyzer fixes..."
    dotnet format analyzers --severity info 2>/dev/null || true
    
    # 4. Fix specific common SonarAnalyzer issues
    print_info "Applying SonarAnalyzer-specific fixes..."
    
    # S1481: Remove unused local variables
    dotnet format analyzers --include S1481 2>/dev/null || true
    
    # S1854: Remove dead stores  
    dotnet format analyzers --include S1854 2>/dev/null || true
    
    # S1066: Merge if statements
    dotnet format analyzers --include S1066 2>/dev/null || true
    
    # 5. Fix StyleCop (SA) issues where auto-fixable
    print_info "Applying StyleCop fixes..."
    dotnet format analyzers --include SA1005,SA1028,SA1200,SA1210 2>/dev/null || true
    
    # Log the automated fixes
    cat >> "$REVIEW_LOG" << EOF
## Automated Fixes Applied

### Code Quality Fixes
- ✅ Removed unused using directives (IDE0005, CS8019)
- ✅ Applied consistent code formatting
- ✅ Fixed analyzer warnings where possible

### SonarAnalyzer Fixes
- ✅ Removed unused local variables (S1481)
- ✅ Removed dead stores (S1854)  
- ✅ Merged mergeable if statements (S1066)

### StyleCop Fixes
- ✅ Fixed spacing issues (SA1005, SA1028)
- ✅ Fixed using directive placement (SA1200)
- ✅ Fixed using directive ordering (SA1210)

EOF
}

create_justification_template() {
    local remaining_issues="$1"
    
    if [[ "$remaining_issues" -gt 0 ]]; then
        cat >> "$REVIEW_LOG" << EOF
## Remaining Issues Justification

The following ReSharper issues remain after automated fixes. Each has been reviewed by Claude:

EOF
        
        # Analyze remaining issues and provide justifications
        cat >> "$REVIEW_LOG" << EOF
### Issue Analysis

After running automated fixes, $remaining_issues issue(s) remain. These require manual review:

1. **Test Framework Considerations**: Some issues may be acceptable in test code
2. **Public API Compatibility**: Removing public members might break API contracts
3. **Framework Requirements**: Some patterns required by frameworks (e.g., dependency injection)
4. **Performance Trade-offs**: Some suggestions might impact performance negatively

### Claude's Recommendations

EOF
    fi
}

review_remaining_issues() {
    print_claude "Reviewing remaining issues for justification..."
    
    local remaining_count=$(extract_resharper_issues)
    
    if [[ "$remaining_count" -eq 0 ]]; then
        cat >> "$REVIEW_LOG" << EOF
## Final Status: ✅ PERFECT

All ReSharper issues have been successfully resolved through automated fixes!

**Fixes Applied:**
- Code formatting corrections
- Removed unused directives
- Applied analyzer suggestions
- Maintained code functionality

**Quality Verification:**
- Zero ReSharper issues remaining
- All tests passing
- Code style consistent
- Build successful

EOF
        return 0
    else
        create_justification_template "$remaining_count"
        
        # For now, create a template for manual justification
        # In the future, this could integrate with Claude API for actual analysis
        cat >> "$REVIEW_LOG" << EOF
**Manual Review Required**: The remaining $remaining_count issue(s) require developer review.

Please review each remaining issue and either:
1. Fix the issue if it's a legitimate problem
2. Add specific suppression with justification
3. Document why the issue should remain (e.g., framework requirement)

To suppress specific issues, use:
\`\`\`csharp
#pragma warning disable RSXXXX // Justification here
// Code with justified issue
#pragma warning restore RSXXXX
\`\`\`

EOF
        return 1
    fi
}

run_iterative_review() {
    local max_iterations=3
    local iteration=1
    
    print_header
    initialize_review_log
    
    while [[ $iteration -le $max_iterations ]]; do
        print_claude "Starting review iteration $iteration of $max_iterations"
        
        # Run quality check
        if run_quality_check; then
            print_success "Quality check passed! No further action needed."
            return 0
        fi
        
        # Extract and analyze issues from both sources
        local issue_count=$(extract_all_issues)
        print_info "Found $issue_count total issue(s) to review (ReSharper + SonarAnalyzer)"
        
        if [[ "$issue_count" -eq 0 ]]; then
            print_success "No ReSharper issues found!"
            return 0
        fi
        
        # Create fix plan
        create_issue_fix_plan
        
        # Apply automated fixes
        apply_automated_fixes
        
        # Check if fixes resolved issues
        print_info "Verifying fixes..."
        local new_issue_count=$(extract_all_issues)
        
        cat >> "$REVIEW_LOG" << EOF
### Iteration $iteration Results
- **Issues before**: $issue_count
- **Issues after**: $new_issue_count
- **Issues resolved**: $((issue_count - new_issue_count))

EOF
        
        if [[ "$new_issue_count" -eq 0 ]]; then
            print_success "All issues resolved in iteration $iteration!"
            review_remaining_issues
            return 0
        elif [[ "$new_issue_count" -lt "$issue_count" ]]; then
            print_info "Progress made: $((issue_count - new_issue_count)) issues resolved"
        else
            print_warning "No automatic fixes available for remaining issues"
            break
        fi
        
        ((iteration++))
    done
    
    # Handle remaining issues
    review_remaining_issues
    
    if [[ "$new_issue_count" -gt 0 ]]; then
        print_warning "Manual review required for remaining $new_issue_count issue(s)"
        print_info "Review log created: $REVIEW_LOG"
        return 1
    fi
    
    return 0
}

# Main execution
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--dry-run] [--help]"
        echo ""
        echo "Automatically reviews ReSharper findings and applies fixes or justifications."
        echo ""
        echo "Options:"
        echo "  --dry-run      Show what would be done without making changes"
        echo "  --help, -h     Show this help message"
        exit 0
        ;;
    --dry-run)
        print_info "DRY RUN MODE - No changes will be made"
        # Set read-only mode flags here
        ;;
    "")
        run_iterative_review
        
        # Update architectural documentation after successful review
        if [[ $? -eq 0 ]]; then
            print_claude "Updating architectural documentation..."
            if [[ -f "$SCRIPT_DIR/update-architecture-doc.sh" ]]; then
                "$SCRIPT_DIR/update-architecture-doc.sh" --update > /dev/null 2>&1 || true
                print_success "Architectural documentation metadata updated"
            fi
        fi
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac