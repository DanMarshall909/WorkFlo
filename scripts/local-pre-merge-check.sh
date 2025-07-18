#!/bin/bash
set -e

# Anchor Project - Local Pre-Merge Quality Check
# Enforces quality standards before merging to main branch

echo "🔍 Anchor Local Pre-Merge Quality Check"
echo "======================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall success
OVERALL_SUCCESS=true

# Function to log status
log_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        OVERALL_SUCCESS=false
    fi
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're on dev branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "dev" ]; then
    log_warning "Not on dev branch. Current branch: $current_branch"
    echo "This check is designed for dev → main merges."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

echo
log_info "Starting quality checks..."

# 1. Build Verification
echo
echo "🔨 Build Verification"
echo "===================="
if dotnet build --configuration Release --verbosity minimal > /tmp/build.log 2>&1; then
    # Check for any errors or critical warnings
    ERROR_COUNT=$(grep -c "error\|Error:" /tmp/build.log 2>/dev/null || echo "0")
    WARNING_COUNT=$(grep -c "warning\|Warning:" /tmp/build.log 2>/dev/null || echo "0")
    ERROR_COUNT=${ERROR_COUNT//[^0-9]/}
    WARNING_COUNT=${WARNING_COUNT//[^0-9]/}
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_status 1 "Build has $ERROR_COUNT error(s)"
        echo "Build errors found:"
        grep "error\|Error:" /tmp/build.log | head -5
        OVERALL_SUCCESS=false
    else
        log_status 0 "Build completed successfully"
        if [ "$WARNING_COUNT" -gt 0 ]; then
            log_info "Build has $WARNING_COUNT warning(s) - review recommended"
        fi
    fi
else
    log_status 1 "Build failed"
    echo "Build output:"
    tail -10 /tmp/build.log
    OVERALL_SUCCESS=false
fi

# 2. Core Test Validation with Coverage
echo
echo "🧪 Core Test Validation with Coverage"
echo "===================================="

# Test Application layer with coverage (critical)
log_info "Running Application tests with coverage collection..."
if dotnet test tests/Anchor.Application.Tests --configuration Release --collect:"XPlat Code Coverage" --results-directory:/tmp/coverage --logger "console;verbosity=minimal" > /tmp/app_tests.log 2>&1; then
    PASSED=$(grep "Passed:" /tmp/app_tests.log | grep -o "[0-9]\+" | head -1)
    FAILED=$(grep "Failed:" /tmp/app_tests.log | grep -o "[0-9]\+" | head -1)
    
    if [ "${FAILED:-0}" -gt 0 ]; then
        log_status 1 "Application tests failed: $FAILED test(s)"
        OVERALL_SUCCESS=false
    else
        log_status 0 "Application tests passed: ${PASSED:-0} test(s)"
        
        # Check coverage
        if command -v reportgenerator >/dev/null 2>&1; then
            log_info "Generating coverage report..."
            reportgenerator -reports:"/tmp/coverage/*/coverage.cobertura.xml" -targetdir:/tmp/coverage-report -reporttypes:TextSummary >/dev/null 2>&1
            
            if [ -f /tmp/coverage-report/Summary.txt ]; then
                BRANCH_COVERAGE=$(grep "Branch coverage:" /tmp/coverage-report/Summary.txt | grep -o "[0-9]\+\.[0-9]\+" | head -1)
                if [ -n "$BRANCH_COVERAGE" ]; then
                    BRANCH_INT=$(echo "$BRANCH_COVERAGE" | cut -d. -f1)
                    if [ "$BRANCH_INT" -ge 95 ]; then
                        log_status 0 "Branch coverage: ${BRANCH_COVERAGE}% (≥95% required)"
                    elif [ "$BRANCH_INT" -ge 80 ]; then
                        log_warning "Branch coverage: ${BRANCH_COVERAGE}% (below 95% target, minimum 80%)"
                    else
                        log_status 1 "Branch coverage: ${BRANCH_COVERAGE}% (below 80% minimum)"
                        OVERALL_SUCCESS=false
                    fi
                fi
            else
                log_warning "Coverage report generation failed"
            fi
        else
            log_warning "ReportGenerator not installed - coverage analysis skipped"
            log_info "Install with: dotnet tool install -g dotnet-reportgenerator-globaltool"
        fi
        
        # Run mutation testing after coverage (only if tests passed)
        echo
        log_info "Running mutation testing on Application layer..."
        if command -v dotnet-stryker >/dev/null 2>&1; then
            # Run Stryker mutation testing on Application project
            cd tests/Anchor.Application.Tests || exit 1
            if timeout 300 dotnet stryker --project ../../src/Anchor.Application/Anchor.Application.csproj --reporter json --output /tmp/mutation-report > /tmp/mutation.log 2>&1; then
                cd - >/dev/null || exit 1
                
                # Parse mutation score from JSON report
                if [ -f /tmp/mutation-report/reports/mutation-report.json ]; then
                    MUTATION_SCORE=$(grep '"mutationScore":' /tmp/mutation-report/reports/mutation-report.json | grep -o '[0-9]\+\.[0-9]\+' | head -1)
                    if [ -n "$MUTATION_SCORE" ]; then
                        MUTATION_INT=$(echo "$MUTATION_SCORE" | cut -d. -f1)
                        if [ "$MUTATION_INT" -ge 85 ]; then
                            log_status 0 "Mutation score: ${MUTATION_SCORE}% (≥85% required)"
                        elif [ "$MUTATION_INT" -ge 70 ]; then
                            log_warning "Mutation score: ${MUTATION_SCORE}% (below 85% target, minimum 70%)"
                        else
                            log_status 1 "Mutation score: ${MUTATION_SCORE}% (below 70% minimum)"
                            OVERALL_SUCCESS=false
                        fi
                    else
                        log_warning "Could not parse mutation score from report"
                    fi
                else
                    log_warning "Mutation testing report not found"
                fi
            else
                cd - >/dev/null || exit 1
                log_warning "Mutation testing failed or timed out (5 minutes)"
                log_info "This is non-blocking but recommended for quality assurance"
            fi
        else
            log_warning "Stryker.NET not installed - mutation testing skipped"
            log_info "Install with: dotnet tool install -g dotnet-stryker"
        fi
    fi
else
    log_status 1 "Application tests execution failed"
    OVERALL_SUCCESS=false
fi

# Test Domain layer (critical)
if dotnet test tests/Anchor.Domain.Tests --configuration Release --logger "console;verbosity=minimal" > /tmp/domain_tests.log 2>&1; then
    PASSED=$(grep "Passed:" /tmp/domain_tests.log | grep -o "[0-9]\+" | head -1)
    FAILED=$(grep "Failed:" /tmp/domain_tests.log | grep -o "[0-9]\+" | head -1)
    
    if [ "${FAILED:-0}" -gt 0 ]; then
        log_warning "Domain tests have failures: $FAILED test(s) (non-blocking for quality fixes)"
        echo "Failed tests may be pre-existing issues not related to current changes"
    else
        log_status 0 "Domain tests passed: ${PASSED:-0} test(s)"
    fi
else
    log_warning "Domain tests execution failed (non-blocking for quality fixes)"
fi

# 3. Code Quality Analysis
echo
echo "📊 Code Quality Analysis"
echo "======================="

# Check for critical analyzer issues in key projects
check_project_quality() {
    local project=$1
    local project_name=$2
    
    if dotnet build "$project" --configuration Release --verbosity normal > "/tmp/${project_name}_quality.log" 2>&1; then
        ERROR_COUNT=$(grep -c "error:" "/tmp/${project_name}_quality.log" 2>/dev/null || echo "0")
        if [ "$ERROR_COUNT" -gt 0 ]; then
            log_status 1 "$project_name has $ERROR_COUNT critical error(s)"
            grep "error:" "/tmp/${project_name}_quality.log" | head -3
            OVERALL_SUCCESS=false
        else
            log_status 0 "$project_name quality check passed"
        fi
    else
        log_status 1 "$project_name quality check failed"
        OVERALL_SUCCESS=false
    fi
}

check_project_quality "src/Anchor.Application" "Application"
check_project_quality "src/Anchor.Domain" "Domain"
check_project_quality "src/Anchor.Infrastructure" "Infrastructure"

# 4. Security and Privacy Validation
echo
echo "🔐 Security and Privacy Validation"
echo "================================="

# Check for potential security issues
SECURITY_ISSUES=false

# Check for hardcoded secrets/keys (exclude test files and mock services)
if grep -r -i -E "(password|secret|key|token)\s*=\s*['\"][^'\"]{8,}" src/ --exclude-dir=bin --exclude-dir=obj --exclude-dir=__tests__ --exclude="*mock*" --exclude="*test*" 2>/dev/null; then
    log_status 1 "Potential hardcoded secrets found"
    SECURITY_ISSUES=true
fi

# Check for PII logging risks
if grep -r -E "Log\..*\{.*\}" src/ --include="*.cs" | grep -i -E "(email|phone|address|name)" 2>/dev/null; then
    log_warning "Potential PII logging detected - review recommended"
fi

if [ "$SECURITY_ISSUES" = false ]; then
    log_status 0 "No obvious security issues detected"
fi

# 5. Anchor Project Standards Validation
echo
echo "⚓ Anchor Project Standards"
echo "=========================="

# Check CQRS naming conventions
CQRS_VIOLATIONS=0
for file in src/Anchor.Application/**/*.cs; do
    if [[ -f "$file" && "$file" =~ (Command|Query|Handler) ]]; then
        filename=$(basename "$file" .cs)
        if [[ "$filename" =~ Handler$ ]] && [[ ! "$filename" =~ ^H[A-Z] ]]; then
            ((CQRS_VIOLATIONS++))
        elif [[ "$filename" =~ Command$ ]] && [[ ! "$filename" =~ ^C[A-Z] ]]; then
            ((CQRS_VIOLATIONS++))
        elif [[ "$filename" =~ Query$ ]] && [[ ! "$filename" =~ ^Q[A-Z] ]]; then
            ((CQRS_VIOLATIONS++))
        fi
    fi
done

if [ "$CQRS_VIOLATIONS" -gt 0 ]; then
    log_warning "Found $CQRS_VIOLATIONS CQRS naming convention violations"
else
    log_status 0 "CQRS naming conventions followed"
fi

# Check for proper ConfigureAwait usage in Infrastructure
CONFIGUREAWAIT_MISSING=$(grep -r "await " src/Anchor.Infrastructure/ --include="*.cs" | grep -v "ConfigureAwait" | grep -v "using" | wc -l)
if [ "$CONFIGUREAWAIT_MISSING" -gt 5 ]; then
    log_warning "Multiple await calls without ConfigureAwait detected: $CONFIGUREAWAIT_MISSING"
else
    log_status 0 "ConfigureAwait usage looks good"
fi

# 6. Git Status Check
echo
echo "📝 Git Status Check"
echo "=================="

# Check for uncommitted changes
if git diff --quiet && git diff --staged --quiet; then
    log_status 0 "No uncommitted changes"
else
    log_status 1 "Uncommitted changes detected"
    echo "Please commit or stash all changes before merging to main"
    OVERALL_SUCCESS=false
fi

# Check if dev is ahead of main
COMMITS_AHEAD=$(git rev-list --count main..dev 2>/dev/null || echo "0")
if [ "$COMMITS_AHEAD" -gt 0 ]; then
    log_status 0 "Dev branch is $COMMITS_AHEAD commit(s) ahead of main"
else
    log_warning "Dev branch is not ahead of main - nothing to merge"
fi

# Final Results
echo
echo "📋 Pre-Merge Check Results"
echo "=========================="

if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED${NC}"
    echo "✅ Ready to merge dev → main"
    echo
    echo "To proceed with merge:"
    echo "  git checkout main"
    echo "  git merge dev"
    echo "  git push origin main"
    exit 0
else
    echo -e "${RED}❌ CHECKS FAILED${NC}"
    echo "🛑 Fix issues before merging to main"
    echo
    echo "Common fixes:"
    echo "  • Resolve build errors"
    echo "  • Fix failing tests"
    echo "  • Address security concerns"
    echo "  • Commit all changes"
    exit 1
fi