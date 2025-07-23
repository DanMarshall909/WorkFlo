#!/bin/bash
set -euo pipefail

# Comprehensive PR Quality Check Script for WorkFlo Project (Bash version)
# This script runs all quality checks required before submitting a PR

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$ROOT_DIR/reports"
START_TIME=$(date +%s)

# Default parameters
SKIP_TESTS=false
SKIP_COVERAGE=false
PRE_PUSH_MODE=false
OUTPUT_PATH="$REPORTS_DIR/pr-quality-report.html"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --pre-push)
            PRE_PUSH_MODE=true
            SKIP_COVERAGE=true  # Skip heavy operations in pre-push
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-coverage)
            SKIP_COVERAGE=true
            shift
            ;;
        --output-path)
            OUTPUT_PATH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [--skip-tests] [--skip-coverage] [--output-path PATH]"
            echo ""
            echo "Options:"
            echo "  --skip-tests       Skip running unit tests"
            echo "  --skip-coverage    Skip code coverage analysis"
            echo "  --output-path PATH Path to save quality report (default: ./reports/pr-quality-report.html)"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Ensure reports directory exists
mkdir -p "$REPORTS_DIR"

# Color functions
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_info() { echo -e "\033[36mℹ️  $1\033[0m"; }
print_header() { 
    echo ""
    echo -e "\033[34m🔄 $1\033[0m"
    echo -e "\033[34m$(printf '=%.0s' {1..80})\033[0m"
}

# Quality check tracking
declare -a CHECKS=()
PASSED=0
FAILED=0
WARNINGS=0
SKIPPED=0

add_check_result() {
    local name="$1"
    local status="$2"
    local details="$3"
    local output_file="${4:-}"
    
    CHECKS+=("$name|$status|$details|$output_file|$(date)")
    
    case "$status" in
        "PASS")
            PASSED=$((PASSED + 1))
            print_success "$name - PASSED"
            ;;
        "FAIL")
            FAILED=$((FAILED + 1))
            print_error "$name - FAILED: $details"
            ;;
        "WARN")
            WARNINGS=$((WARNINGS + 1))
            print_warning "$name - WARNING: $details"
            ;;
        "SKIP")
            SKIPPED=$((SKIPPED + 1))
            print_info "$name - SKIPPED: $details"
            ;;
    esac
}

command_exists() {
    # Check in PATH first
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    fi
    
    # Check in .dotnet/tools for jb specifically
    if [ "$1" = "jb" ] && [ -f "$HOME/.dotnet/tools/jb" ]; then
        return 0
    fi
    
    return 1
}

print_header "🚀 Starting PR Quality Check for WorkFlo Project"
print_info "Report will be saved to: $OUTPUT_PATH"
print_info "Started at: $(date)"

cd "$ROOT_DIR"

# 1. Verify Required Tools
print_header "🔧 Verifying Required Tools"

if command_exists dotnet; then
    add_check_result "Tool: .NET SDK" "PASS" "Available and working"
else
    add_check_result "Tool: .NET SDK" "FAIL" "Not found. Please install .NET SDK"
fi

if command_exists jb; then
    add_check_result "Tool: ReSharper CLI" "PASS" "Available and working"
else
    add_check_result "Tool: ReSharper CLI" "SKIP" "Not found. ReSharper analysis will be skipped."
fi

# 2. Clean and Restore
print_header "🧹 Clean and Restore"

if dotnet clean --verbosity quiet >/dev/null 2>&1; then
    add_check_result "Clean Solution" "PASS" "Solution cleaned successfully"
else
    add_check_result "Clean Solution" "FAIL" "Failed to clean solution"
fi

if dotnet restore --verbosity quiet >/dev/null 2>&1; then
    add_check_result "Restore Packages" "PASS" "Packages restored successfully"
else
    add_check_result "Restore Packages" "FAIL" "Failed to restore packages"
fi

# 3. Build Solution
print_header "🔨 Build Verification"

print_info "Starting build process..."
BUILD_OUTPUT=$(dotnet build --no-restore --verbosity minimal 2>&1)
BUILD_EXIT_CODE=$?
print_info "Build completed with exit code: $BUILD_EXIT_CODE"

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    WARNING_COUNT=$(echo "$BUILD_OUTPUT" | grep -c "warning" || true)
    if [ "$WARNING_COUNT" -gt 0 ]; then
        add_check_result "Build Solution" "WARN" "$WARNING_COUNT build warnings found"
    else
        add_check_result "Build Solution" "PASS" "Build completed without warnings"
    fi
else
    add_check_result "Build Solution" "FAIL" "Build failed. Check build output for details."
    print_error "❌ Build failed! Cannot continue with tests."
    echo "Build Output:"
    echo "$BUILD_OUTPUT"
    exit 1
fi

# 4. Code Formatting Check
print_header "🎨 Code Formatting"

print_info "Checking code formatting..."
if dotnet format --verify-no-changes --verbosity diagnostic >/dev/null 2>&1; then
    add_check_result "Code Formatting" "PASS" "All files are properly formatted"
else
    add_check_result "Code Formatting" "FAIL" "Code formatting issues found. Run 'dotnet format' to fix."
fi

# 5. ReSharper Code Inspection
print_header "🔍 ReSharper Code Analysis"

RESHARPER_OUTPUT_FILE="$REPORTS_DIR/resharper-report.xml"

if command_exists jb; then
    # Use full path if jb is in .dotnet/tools
    JB_CMD="jb"
    if [ ! -x "$(command -v jb)" ] && [ -f "$HOME/.dotnet/tools/jb" ]; then
        JB_CMD="$HOME/.dotnet/tools/jb"
    fi
    
    if $JB_CMD inspectcode WorkFlo.sln --output="$RESHARPER_OUTPUT_FILE" --format=Xml --severity=WARNING >/dev/null 2>&1; then
        if [ -f "$RESHARPER_OUTPUT_FILE" ]; then
            # Parse XML to count issues (simplified)
            ISSUE_COUNT=$(grep -c "<Issue " "$RESHARPER_OUTPUT_FILE" 2>/dev/null || echo "0")
            
            if [ "$ISSUE_COUNT" -eq 0 ]; then
                add_check_result "ReSharper Analysis" "PASS" "No code issues found" "$RESHARPER_OUTPUT_FILE"
            elif [ "$ISSUE_COUNT" -le 10 ]; then
                add_check_result "ReSharper Analysis" "WARN" "$ISSUE_COUNT code issues found (acceptable threshold)" "$RESHARPER_OUTPUT_FILE"
            else
                add_check_result "ReSharper Analysis" "FAIL" "$ISSUE_COUNT code issues found (exceeds threshold of 10)" "$RESHARPER_OUTPUT_FILE"
            fi
        else
            add_check_result "ReSharper Analysis" "FAIL" "ReSharper report file not generated"
        fi
    else
        add_check_result "ReSharper Analysis" "FAIL" "ReSharper analysis failed"
    fi
else
    add_check_result "ReSharper Analysis" "SKIP" "ReSharper CLI tools not available"
fi

# 6. Security Analysis
print_header "🛡️ Security Analysis"

SECRET_PATTERNS=(
    "password\s*="
    "connectionstring\s*="
    "apikey\s*="
    "secret\s*="
    "token\s*="
)

TOTAL_FINDINGS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    FINDINGS=$(find src -name "*.cs" -exec grep -l -i "$pattern" {} \; 2>/dev/null | wc -l)
    TOTAL_FINDINGS=$((TOTAL_FINDINGS + FINDINGS))
done

if [ "$TOTAL_FINDINGS" -eq 0 ]; then
    add_check_result "Security Scan" "PASS" "No potential secrets found in source code"
else
    add_check_result "Security Scan" "WARN" "$TOTAL_FINDINGS potential secret patterns found - manual review required"
fi

# 7. Unit Tests
if [ "$SKIP_TESTS" = false ]; then
    print_header "🧪 Unit Tests"
    
    TEST_OUTPUT_FILE="$REPORTS_DIR/test-results.trx"
    
    print_info "Running unit tests (using pre-built assemblies)..."
    if dotnet test --no-build --verbosity minimal --logger "trx;LogFileName=$TEST_OUTPUT_FILE" >/dev/null 2>&1; then
        if [ -f "$TEST_OUTPUT_FILE" ]; then
            # Parse test results (simplified)
            TOTAL_TESTS=$(grep -o 'total="[0-9]*"' "$TEST_OUTPUT_FILE" | grep -o '[0-9]*' || echo "0")
            PASSED_TESTS=$(grep -o 'passed="[0-9]*"' "$TEST_OUTPUT_FILE" | grep -o '[0-9]*' || echo "0")
            FAILED_TESTS=$(grep -o 'failed="[0-9]*"' "$TEST_OUTPUT_FILE" | grep -o '[0-9]*' || echo "0")
            
            if [ "$FAILED_TESTS" -eq 0 ]; then
                add_check_result "Unit Tests" "PASS" "$PASSED_TESTS/$TOTAL_TESTS tests passed" "$TEST_OUTPUT_FILE"
            else
                add_check_result "Unit Tests" "FAIL" "$FAILED_TESTS/$TOTAL_TESTS tests failed" "$TEST_OUTPUT_FILE"
            fi
        else
            add_check_result "Unit Tests" "PASS" "All tests passed (results file not found)"
        fi
    else
        add_check_result "Unit Tests" "FAIL" "Test execution failed"
    fi
else
    add_check_result "Unit Tests" "SKIP" "Skipped by user request"
fi

# 8. Code Coverage
if [ "$SKIP_COVERAGE" = false ] && [ "$SKIP_TESTS" = false ]; then
    print_header "📊 Code Coverage"
    
    print_info "Running code coverage analysis..."
    if dotnet test --no-build --collect:"XPlat Code Coverage" >/dev/null 2>&1; then
        COVERAGE_FILE=$(find . -name "coverage.cobertura.xml" | head -1)
        
        if [ -n "$COVERAGE_FILE" ]; then
            # Extract coverage percentage (simplified)
            LINE_RATE=$(grep -o 'line-rate="[0-9.]*"' "$COVERAGE_FILE" | grep -o '[0-9.]*' || echo "0")
            COVERAGE_PERCENT=$(echo "$LINE_RATE * 100" | bc -l | cut -d. -f1)
            
            if [ "$COVERAGE_PERCENT" -ge 80 ]; then
                add_check_result "Code Coverage" "PASS" "${COVERAGE_PERCENT}% line coverage (target: 80%)" "$COVERAGE_FILE"
            elif [ "$COVERAGE_PERCENT" -ge 60 ]; then
                add_check_result "Code Coverage" "WARN" "${COVERAGE_PERCENT}% line coverage (target: 80%)" "$COVERAGE_FILE"
            else
                add_check_result "Code Coverage" "FAIL" "${COVERAGE_PERCENT}% line coverage (below minimum 60%)" "$COVERAGE_FILE"
            fi
        else
            add_check_result "Code Coverage" "WARN" "Coverage report not generated"
        fi
    else
        add_check_result "Code Coverage" "WARN" "Coverage analysis failed"
    fi
else
    add_check_result "Code Coverage" "SKIP" "Skipped (tests disabled or by user request)"
fi

# 9. Documentation Check
print_header "📚 Documentation Verification"

REQUIRED_DOCS=("README.md" "CLAUDE.md" "docs/domain-glossary.md" "docs/architectural-summary.md")
MISSING_DOCS=()

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
        MISSING_DOCS+=("$doc")
    fi
done

if [ ${#MISSING_DOCS[@]} -eq 0 ]; then
    add_check_result "Documentation" "PASS" "All required documentation files present"
else
    add_check_result "Documentation" "WARN" "Missing documentation: $(IFS=', '; echo "${MISSING_DOCS[*]}")"
fi

# 9.1. Architectural Summary Update Check
print_header "🏗️ Architectural Summary Maintenance"

update_architectural_summary() {
    local arch_file="docs/architectural-summary.md"
    local current_date=$(date '+%B %d, %Y')
    local current_version=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    if [ -f "$arch_file" ]; then
        # Update placeholders in the architectural summary
        sed -i "s/{UPDATE_DATE}/$current_date/g" "$arch_file"
        sed -i "s/{VERSION}/$current_version/g" "$arch_file"
        
        # Check if architecture document needs attention based on recent changes
        local significant_changes=false
        
        # Check for new files in key directories
        if git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E "src/.*\.(cs|csproj)$|docs/.*\.md$" > /dev/null; then
            significant_changes=true
        fi
        
        # Check for changes to domain models
        if git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E "src/.*/Domain/.*\.cs$" > /dev/null; then
            significant_changes=true
        fi
        
        # Check for new architectural patterns
        if git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E "src/.*/Application/.*\.cs$|src/.*/Infrastructure/.*\.cs$" > /dev/null; then
            significant_changes=true
        fi
        
        if [ "$significant_changes" = true ]; then
            add_check_result "Architecture Doc Update" "WARN" "Significant code changes detected - consider updating architectural summary"
            echo ""
            echo -e "\033[33m💡 Architecture Update Suggestion:\033[0m"
            echo "   Recent changes detected in:"
            git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E "src/.*\.(cs|csproj)$|docs/.*\.md$" | head -5 | sed 's/^/   - /'
            echo "   Consider updating docs/architectural-summary.md to reflect any:"
            echo "   - New domain entities or aggregates"
            echo "   - Changed CQRS patterns"
            echo "   - Updated technology stack"
            echo "   - New architectural decisions"
            echo ""
        else
            add_check_result "Architecture Doc Update" "PASS" "Architecture documentation appears current"
        fi
    else
        add_check_result "Architecture Doc Update" "FAIL" "Architectural summary not found at docs/architectural-summary.md"
    fi
}

update_architectural_summary

# 10. Git Status Check
print_header "📝 Git Status"

if command_exists git; then
    CHANGED_FILES=$(git status --porcelain | wc -l)
    if [ "$CHANGED_FILES" -gt 0 ]; then
        add_check_result "Git Status" "INFO" "$CHANGED_FILES files have changes"
    else
        add_check_result "Git Status" "PASS" "Working directory is clean"
    fi
else
    add_check_result "Git Status" "WARN" "Git not available"
fi

# Calculate overall status
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ "$FAILED" -gt 0 ]; then
    OVERALL_STATUS="FAILED"
elif [ "$WARNINGS" -gt 0 ]; then
    OVERALL_STATUS="PASSED_WITH_WARNINGS"
else
    OVERALL_STATUS="PASSED"
fi

# Generate HTML Report
print_header "📋 Generating Quality Report"

cat > "$OUTPUT_PATH" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>WorkFlo PR Quality Report</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #007acc; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #007acc; }
        .status-PASSED { color: #28a745; }
        .status-FAILED { color: #dc3545; }
        .status-PASSED_WITH_WARNINGS { color: #ffc107; }
        .checks { margin-top: 20px; }
        .check { margin-bottom: 15px; padding: 15px; border-radius: 6px; border-left: 4px solid; }
        .check.PASS { background: #d4edda; border-color: #28a745; }
        .check.FAIL { background: #f8d7da; border-color: #dc3545; }
        .check.WARN { background: #fff3cd; border-color: #ffc107; }
        .check.SKIP { background: #e2e3e5; border-color: #6c757d; }
        .check.INFO { background: #d1ecf1; border-color: #17a2b8; }
        .check-name { font-weight: bold; margin-bottom: 5px; }
        .check-details { font-size: 0.9em; opacity: 0.8; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; }
        .timestamp { font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 WorkFlo PR Quality Report</h1>
            <h2 class="status-$OVERALL_STATUS">$OVERALL_STATUS</h2>
            <p class="timestamp">Generated: $(date) | Duration: $((DURATION / 60)) minutes</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="number status-PASSED">$PASSED</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="number status-FAILED">$FAILED</div>
            </div>
            <div class="summary-card">
                <h3>Warnings</h3>
                <div class="number" style="color: #ffc107;">$WARNINGS</div>
            </div>
            <div class="summary-card">
                <h3>Skipped</h3>
                <div class="number" style="color: #6c757d;">$SKIPPED</div>
            </div>
        </div>
        
        <div class="checks">
            <h3>Quality Check Results</h3>
EOF

# Add check results to HTML
for check in "${CHECKS[@]}"; do
    IFS='|' read -r name status details output_file timestamp <<< "$check"
    cat >> "$OUTPUT_PATH" << EOF
            <div class="check $status">
                <div class="check-name">$name</div>
                <div class="check-details">$details</div>
EOF
    if [ -n "$output_file" ]; then
        cat >> "$OUTPUT_PATH" << EOF
                <div class="check-details"><strong>Output:</strong> $output_file</div>
EOF
    fi
    cat >> "$OUTPUT_PATH" << EOF
            </div>
EOF
done

cat >> "$OUTPUT_PATH" << EOF
        </div>
        
        <div class="footer">
            <p>Generated by WorkFlo PR Quality Check Script</p>
            <p>For more information, see <code>scripts/README.md</code></p>
        </div>
    </div>
</body>
</html>
EOF

add_check_result "Report Generation" "PASS" "Quality report saved to $OUTPUT_PATH" "$OUTPUT_PATH"

# Summary
print_header "📊 Quality Check Summary"
print_info "Overall Status: $OVERALL_STATUS"
print_info "Passed: $PASSED"
print_info "Failed: $FAILED"
print_info "Warnings: $WARNINGS"
print_info "Skipped: $SKIPPED"
print_info "Duration: $((DURATION / 60)) minutes"
print_info "Report: $OUTPUT_PATH"

# Exit with appropriate code
if [ "$FAILED" -gt 0 ]; then
    print_error "❌ Quality checks FAILED! $FAILED critical issues found."
    print_info "Review the report and fix issues before submitting PR."
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    print_warning "⚠️  Quality checks PASSED with $WARNINGS warnings."
    print_info "Consider addressing warnings before submitting PR."
    exit 0
else
    print_success "✅ All quality checks PASSED! Ready to submit PR."
    exit 0
fi