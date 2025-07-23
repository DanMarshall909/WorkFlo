#!/bin/bash
# privacy-guard.sh - BLOCKS PII violations and enforces privacy-first principles
# Scans code for personal information and security violations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() { echo -e "${BLUE}🔐 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_critical() { echo -e "${RED}🚨 $1${NC}"; }

print_header "Privacy Guard - PII Detection & Security Scanning"
echo ""

# PII Detection patterns
declare -A PII_PATTERNS=(
    # Email patterns
    ["email"]='[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    
    # Phone number patterns
    ["phone_us"]='(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})'
    ["phone_intl"]='(\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})'
    
    # Credit card patterns
    ["credit_card"]='(\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b|\b\d{13,19}\b)'
    
    # SSN patterns
    ["ssn"]='(\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b)'
    
    # API keys and secrets
    ["api_key"]='(api[_-]?key|secret[_-]?key|access[_-]?token)["\s]*[:=]["\s]*[a-zA-Z0-9_-]{20,}'
    ["jwt_token"]='(bearer\s+)?eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+'
    
    # Database credentials
    ["password"]='(password|pwd|pass)["\s]*[:=]["\s]*[^"\s]{3,}'
    ["connection_string"]='(server|host|database|uid|pwd)["\s]*[:=]'
    
    # Personal names (common patterns)
    ["personal_name"]='(first[_-]?name|last[_-]?name|full[_-]?name)["\s]*[:=]["\s]*[A-Z][a-z]+'
    
    # Addresses
    ["address"]='(\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl))'
    
    # IP addresses (private networks might be okay, but flag for review)
    ["ip_address"]='(\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b)'
)

# Whitelist patterns (exclude these from detection)
declare -A WHITELIST_PATTERNS=(
    ["test_email"]='(test@example\.com|user@test\.com|demo@.*\.test)'
    ["localhost"]='(localhost|127\.0\.0\.1|0\.0\.0\.0)'
    ["example_data"]='(example|sample|demo|test|placeholder)'
    ["documentation"]='(TODO|FIXME|NOTE|XXX)'
)

# Function to scan a file for PII
scan_file_for_pii() {
    local file="$1"
    local violations=()
    local warnings=()
    
    # Skip binary files and certain file types
    if [[ "$file" =~ \.(exe|dll|bin|pdf|img|png|jpg|jpeg|gif|ico|zip|tar|gz)$ ]]; then
        return 0
    fi
    
    # Skip certain directories
    if [[ "$file" =~ (node_modules|\.git|bin|obj|\.vs|\.vscode|coverage|TestResults|StrykerOutput)/ ]]; then
        return 0
    fi
    
    # Read file content
    local content=""
    if [[ -f "$file" ]]; then
        content=$(cat "$file" 2>/dev/null || echo "")
    else
        return 0
    fi
    
    # Check each PII pattern
    for pattern_name in "${!PII_PATTERNS[@]}"; do
        local pattern="${PII_PATTERNS[$pattern_name]}"
        
        # Find matches
        local matches=$(echo "$content" | grep -iE "$pattern" || echo "")
        
        if [[ -n "$matches" ]]; then
            # Check if matches are whitelisted
            local whitelisted=false
            for whitelist_name in "${!WHITELIST_PATTERNS[@]}"; do
                local whitelist_pattern="${WHITELIST_PATTERNS[$whitelist_name]}"
                if echo "$matches" | grep -iqE "$whitelist_pattern"; then
                    whitelisted=true
                    break
                fi
            done
            
            if [[ "$whitelisted" == false ]]; then
                # Extract line numbers
                local line_numbers=$(echo "$content" | grep -inE "$pattern" | cut -d: -f1 | tr '\n' ',' | sed 's/,$//')
                
                case "$pattern_name" in
                    "email"|"phone_us"|"phone_intl"|"personal_name"|"address")
                        violations+=("$file:$line_numbers:PII:$pattern_name")
                        ;;
                    "credit_card"|"ssn"|"api_key"|"jwt_token"|"password")
                        violations+=("$file:$line_numbers:CRITICAL:$pattern_name")
                        ;;
                    "connection_string"|"ip_address")
                        warnings+=("$file:$line_numbers:WARNING:$pattern_name")
                        ;;
                esac
            fi
        fi
    done
    
    # Print violations
    for violation in "${violations[@]}"; do
        echo "VIOLATION:$violation"
    done
    
    # Print warnings
    for warning in "${warnings[@]}"; do
        echo "WARNING:$warning"
    done
    
    return $([ ${#violations[@]} -eq 0 ] && echo 0 || echo 1)
}

# Function to scan staged files
scan_staged_files() {
    print_info "🔍 Scanning staged files for PII violations..."
    echo ""
    
    # Get list of staged files
    local staged_files=$(git diff --cached --name-only 2>/dev/null || echo "")
    
    if [[ -z "$staged_files" ]]; then
        print_warning "No staged files found"
        return 0
    fi
    
    local total_files=0
    local violation_count=0
    local warning_count=0
    local critical_count=0
    
    declare -a violation_files=()
    declare -a warning_files=()
    declare -a critical_files=()
    
    # Scan each staged file
    while IFS= read -r file; do
        if [[ -n "$file" ]]; then
            ((total_files++))
            
            # Use git show to get the staged version of the file
            local staged_content=$(git show ":$file" 2>/dev/null || echo "")
            
            if [[ -n "$staged_content" ]]; then
                # Create temporary file with staged content
                local temp_file=$(mktemp)
                echo "$staged_content" > "$temp_file"
                
                # Scan the temporary file
                local scan_result=$(scan_file_for_pii "$temp_file" 2>/dev/null)
                
                if [[ -n "$scan_result" ]]; then
                    while IFS= read -r line; do
                        if [[ "$line" =~ ^VIOLATION: ]]; then
                            local violation_info="${line#VIOLATION:}"
                            local severity=$(echo "$violation_info" | cut -d: -f3)
                            
                            case "$severity" in
                                "CRITICAL")
                                    critical_files+=("$file:$violation_info")
                                    ((critical_count++))
                                    ;;
                                "PII")
                                    violation_files+=("$file:$violation_info")
                                    ((violation_count++))
                                    ;;
                            esac
                        elif [[ "$line" =~ ^WARNING: ]]; then
                            warning_files+=("$file:${line#WARNING:}")
                            ((warning_count++))
                        fi
                    done <<< "$scan_result"
                fi
                
                rm -f "$temp_file"
            fi
        fi
    done <<< "$staged_files"
    
    # Report results
    print_info "📊 Privacy Scan Results:"
    echo "  • Files scanned: $total_files"
    echo "  • Critical violations: $critical_count"
    echo "  • PII violations: $violation_count"
    echo "  • Warnings: $warning_count"
    echo ""
    
    # Show critical violations (block commit)
    if [[ $critical_count -gt 0 ]]; then
        print_critical "🚨 CRITICAL SECURITY VIOLATIONS FOUND:"
        echo ""
        for critical in "${critical_files[@]}"; do
            local file_path=$(echo "$critical" | cut -d: -f1)
            local line_nums=$(echo "$critical" | cut -d: -f2)
            local pattern_type=$(echo "$critical" | cut -d: -f5)
            
            print_error "  🔴 $file_path (lines: $line_nums)"
            echo "      Type: $pattern_type"
            echo "      Risk: HIGH - Contains sensitive credentials or data"
        done
        echo ""
        print_critical "🚫 COMMIT BLOCKED - Remove sensitive data before committing"
        return 1
    fi
    
    # Show PII violations (block commit)
    if [[ $violation_count -gt 0 ]]; then
        print_error "❌ PII VIOLATIONS FOUND:"
        echo ""
        for violation in "${violation_files[@]}"; do
            local file_path=$(echo "$violation" | cut -d: -f1)
            local line_nums=$(echo "$violation" | cut -d: -f2)
            local pattern_type=$(echo "$violation" | cut -d: -f5)
            
            print_error "  🔴 $file_path (lines: $line_nums)"
            echo "      Type: $pattern_type"
            echo "      Risk: MEDIUM - Contains personal information"
        done
        echo ""
        print_error "🚫 COMMIT BLOCKED - Remove or sanitize PII before committing"
        echo ""
        print_info "🔧 Remediation options:"
        echo "  • Replace with placeholder values"
        echo "  • Move to configuration files"
        echo "  • Use environment variables"
        echo "  • Implement data sanitization"
        return 1
    fi
    
    # Show warnings (allow commit with notice)
    if [[ $warning_count -gt 0 ]]; then
        print_warning "⚠️  PRIVACY WARNINGS:"
        echo ""
        for warning in "${warning_files[@]}"; do
            local file_path=$(echo "$warning" | cut -d: -f1)
            local line_nums=$(echo "$warning" | cut -d: -f2)
            local pattern_type=$(echo "$warning" | cut -d: -f5)
            
            print_warning "  🟡 $file_path (lines: $line_nums)"
            echo "      Type: $pattern_type"
            echo "      Risk: LOW - Review for privacy implications"
        done
        echo ""
        print_info "⚠️  Warnings don't block commit but should be reviewed"
    fi
    
    if [[ $violation_count -eq 0 && $critical_count -eq 0 ]]; then
        print_success "✅ No PII violations detected in staged files"
        return 0
    fi
    
    return 1
}

# Function to scan entire codebase
scan_full_codebase() {
    print_info "🔍 Scanning entire codebase for PII violations..."
    echo ""
    
    local scan_dirs=("src" "tests" "scripts" "docs")
    local total_files=0
    local violation_files=0
    
    for dir in "${scan_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            print_info "Scanning directory: $dir/"
            
            while IFS= read -r -d '' file; do
                ((total_files++))
                
                if ! scan_file_for_pii "$file" >/dev/null 2>&1; then
                    ((violation_files++))
                    print_warning "  PII found in: $file"
                fi
                
                # Progress indicator
                if [[ $((total_files % 50)) -eq 0 ]]; then
                    echo -n "."
                fi
            done < <(find "$dir" -type f -print0 2>/dev/null)
        fi
    done
    
    echo ""
    echo ""
    print_info "📊 Full Codebase Scan Results:"
    echo "  • Files scanned: $total_files"
    echo "  • Files with violations: $violation_files"
    
    if [[ $violation_files -eq 0 ]]; then
        print_success "✅ No PII violations found in codebase"
    else
        print_warning "⚠️  $violation_files file(s) contain potential PII"
        print_info "Use 'privacy-guard.sh staged' to see details before committing"
    fi
}

# Function to check specific files
check_files() {
    local files=("$@")
    
    if [[ ${#files[@]} -eq 0 ]]; then
        print_error "No files specified"
        return 1
    fi
    
    print_info "🔍 Scanning specified files for PII violations..."
    echo ""
    
    local violation_count=0
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            print_info "Checking: $file"
            
            if ! scan_file_for_pii "$file"; then
                ((violation_count++))
            fi
        else
            print_warning "File not found: $file"
        fi
    done
    
    echo ""
    if [[ $violation_count -eq 0 ]]; then
        print_success "✅ No PII violations found in specified files"
        return 0
    else
        print_error "❌ PII violations found in $violation_count file(s)"
        return 1
    fi
}

# Function to show help
show_help() {
    echo "🔐 Privacy Guard - PII Detection & Security Scanning"
    echo ""
    echo "Usage:"
    echo "  privacy-guard.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  staged       Scan staged files (for commit hooks)"
    echo "  full         Scan entire codebase"
    echo "  check FILE   Scan specific file(s)"
    echo "  patterns     Show PII detection patterns"
    echo "  help         Show this help"
    echo ""
    echo "🔍 What gets detected:"
    echo "  🚨 CRITICAL: API keys, passwords, JWT tokens, credit cards, SSNs"
    echo "  ❌ PII: Email addresses, phone numbers, personal names, addresses"
    echo "  ⚠️  WARNINGS: Connection strings, IP addresses"
    echo ""
    echo "🛡️  Privacy Protection Features:"
    echo "  • Blocks commits with sensitive data"
    echo "  • Whitelists test/example data"
    echo "  • Provides remediation guidance"
    echo "  • Supports privacy-first development"
    echo ""
    echo "💡 Integration:"
    echo "  • Add to safe-commit.sh: ./scripts/privacy-guard.sh staged"
    echo "  • Pre-commit hook: ./scripts/privacy-guard.sh staged"
    echo "  • CI/CD pipeline: ./scripts/privacy-guard.sh full"
}

# Function to show patterns
show_patterns() {
    echo "🔍 PII Detection Patterns:"
    echo ""
    
    echo "🚨 CRITICAL (blocks commit):"
    echo "  • API Keys: ${PII_PATTERNS[api_key]}"
    echo "  • JWT Tokens: ${PII_PATTERNS[jwt_token]}"
    echo "  • Passwords: ${PII_PATTERNS[password]}"
    echo "  • Credit Cards: ${PII_PATTERNS[credit_card]}"
    echo "  • SSNs: ${PII_PATTERNS[ssn]}"
    echo ""
    
    echo "❌ PII (blocks commit):"
    echo "  • Emails: ${PII_PATTERNS[email]}"
    echo "  • US Phones: ${PII_PATTERNS[phone_us]}"
    echo "  • Intl Phones: ${PII_PATTERNS[phone_intl]}"
    echo "  • Names: ${PII_PATTERNS[personal_name]}"
    echo "  • Addresses: ${PII_PATTERNS[address]}"
    echo ""
    
    echo "⚠️  WARNINGS (allows commit):"
    echo "  • Connection Strings: ${PII_PATTERNS[connection_string]}"
    echo "  • IP Addresses: ${PII_PATTERNS[ip_address]}"
    echo ""
    
    echo "✅ WHITELISTED:"
    for pattern_name in "${!WHITELIST_PATTERNS[@]}"; do
        echo "  • $pattern_name: ${WHITELIST_PATTERNS[$pattern_name]}"
    done
}

# Main command handling
case "${1:-staged}" in
    "staged")
        scan_staged_files
        ;;
    "full")
        scan_full_codebase
        ;;
    "check")
        shift
        check_files "$@"
        ;;
    "patterns")
        show_patterns
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use: ./scripts/privacy-guard.sh help"
        exit 1
        ;;
esac