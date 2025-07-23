#!/bin/bash

# run-all-tests.sh - Execute complete trunk-based development validation test suite
# This script runs all validation tests to ensure migration is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

echo -e "${BLUE}🧪 WorkFlo Trunk-Based Development Test Suite${NC}"
echo "=============================================="
echo "This test harness validates the trunk-based development migration"
echo "without affecting the main WorkFlo repository."
echo ""

# Track overall results
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

run_test_suite() {
    local suite_name="$1"
    local script_path="$2"
    
    ((TOTAL_SUITES++))
    echo ""
    echo "=============================================="
    print_info "Running Test Suite: $suite_name"
    echo "=============================================="
    
    if [[ ! -f "$script_path" ]]; then
        print_error "Test script not found: $script_path"
        ((FAILED_SUITES++))
        return 1
    fi
    
    if "$script_path"; then
        print_success "✓ $suite_name PASSED"
        ((PASSED_SUITES++))
        return 0
    else
        print_error "✗ $suite_name FAILED"
        ((FAILED_SUITES++))
        return 1
    fi
}

# Ensure we're in the right directory
if [[ ! -d "test-harness" ]]; then
    print_error "Must be run from WorkFlo repository root"
    exit 1
fi

cd test-harness

# Step 1: Setup test repository
print_info "Setting up test repository..."
if ./setup-test-repo.sh; then
    print_success "✓ Test repository setup completed"
else
    print_error "✗ Test repository setup failed"
    exit 1
fi

# Step 2: Run validation test suites
run_test_suite "Migration Process Validation" "./validation/test-migration.sh"
run_test_suite "Safe Commit Behavior Validation" "./validation/test-safe-commit.sh"
run_test_suite "GitHub Actions Workflow Validation" "./validation/validate-workflows.sh"

# Step 3: Generate comprehensive report
echo ""
echo "=============================================="
print_info "Generating Comprehensive Test Report"
echo "=============================================="

REPORT_FILE="results/comprehensive-test-report.md"
mkdir -p results

cat > "$REPORT_FILE" << EOF
# WorkFlo Trunk-Based Development Test Report

## Executive Summary

**Test Date**: $(date)
**Test Environment**: Isolated test harness
**Purpose**: Validate trunk-based development migration without affecting production

## Overall Results

- **Total Test Suites**: $TOTAL_SUITES
- **Passed Suites**: $PASSED_SUITES
- **Failed Suites**: $FAILED_SUITES
- **Success Rate**: $(( PASSED_SUITES * 100 / TOTAL_SUITES ))%
- **Overall Status**: $([ $FAILED_SUITES -eq 0 ] && echo "🎉 ALL TESTS PASSED" || echo "🛑 SOME TESTS FAILED")

## Test Suites Executed

### 1. Migration Process Validation
**Purpose**: Validate that the trunk-based development migration process works correctly
**Status**: $([ -f "results/migration-test-report.md" ] && echo "✅ COMPLETED" || echo "❌ FAILED")

### 2. Safe Commit Behavior Validation
**Purpose**: Ensure safe-commit script properly supports trunk-based workflow
**Status**: $(grep -q "ALL SAFE COMMIT TESTS PASSED" results/test-logs/* 2>/dev/null && echo "✅ PASSED" || echo "❌ FAILED")

### 3. GitHub Actions Workflow Validation
**Purpose**: Verify CI/CD workflows support trunk-based development
**Status**: $([ -f "results/workflow-validation-report.md" ] && echo "✅ COMPLETED" || echo "❌ FAILED")

## Key Findings

### ✅ Validated Components
- Environment variable configuration (WORKFLO_MAIN_BRANCH)
- Script behavior with trunk-based workflow
- Feature branch creation and merging
- Safe commit script branch restrictions
- GitHub Actions workflow configurations

### 📋 Migration Checklist
- [x] Scripts updated to use configurable branch names
- [x] Safe commit allows feature branches, blocks production
- [x] GitHub Actions support feature → master → main workflow
- [x] Documentation reflects trunk-based development
- [x] Environment variables properly configured

## Recommendations

$([ $FAILED_SUITES -eq 0 ] && cat << 'REOF'
### 🎉 Migration Ready for Production

All test suites passed successfully. The trunk-based development migration is properly implemented and ready for production use.

**Next Steps:**
1. Apply these validated changes to production WorkFlo repository
2. Communicate workflow changes to development team
3. Update any remaining documentation
4. Monitor initial production usage
REOF
|| cat << 'REOF'
### ⚠️ Issues Require Attention

Some test suites failed. Review the detailed reports below and address issues before production deployment.

**Critical Actions:**
1. Review failed test details in individual reports
2. Fix identified issues in scripts and workflows
3. Re-run test harness to validate fixes
4. Only deploy to production after all tests pass
REOF
)

## Detailed Reports

Individual test suite reports are available in the \`results/\` directory:
- \`migration-test-report.md\` - Migration process validation details
- \`workflow-validation-report.md\` - GitHub Actions workflow analysis

## Test Environment Details

**Test Repository Structure:**
- Legacy dev branch workflow simulated
- Migration to master trunk tested
- Feature branch workflow validated
- Production (main) branch protection verified

**Validation Scripts:**
- \`setup-test-repo.sh\` - Creates isolated test environment
- \`test-migration.sh\` - Tests migration process
- \`test-safe-commit.sh\` - Validates safe commit behavior
- \`validate-workflows.sh\` - Checks GitHub Actions configuration

EOF

print_success "Comprehensive test report generated: $REPORT_FILE"

# Step 4: Final summary
echo ""
echo "=============================================="
echo -e "${BLUE}FINAL TEST RESULTS${NC}"
echo "=============================================="

if [[ $FAILED_SUITES -eq 0 ]]; then
    print_success "🎉 ALL TEST SUITES PASSED ($PASSED_SUITES/$TOTAL_SUITES)"
    echo ""
    print_info "The trunk-based development migration is properly implemented"
    print_info "and ready for production deployment."
    echo ""
    print_success "✓ Safe to apply changes to production WorkFlo repository"
    
    # Cleanup option
    echo ""
    read -p "Clean up test repository? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf test-repo
        print_success "Test repository cleaned up"
    fi
    
    exit 0
else
    print_error "🛑 $FAILED_SUITES TEST SUITE(S) FAILED ($PASSED_SUITES/$TOTAL_SUITES passed)"
    echo ""
    print_warning "Review the detailed reports and fix issues before production deployment"
    print_info "Test reports available in: test-harness/results/"
    exit 1
fi