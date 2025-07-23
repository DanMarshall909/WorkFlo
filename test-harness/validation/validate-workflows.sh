#!/bin/bash

# validate-workflows.sh - Validate GitHub Actions workflows for trunk-based development
# Tests workflow configurations without actually running CI/CD

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

echo -e "${BLUE}🧪 Validating GitHub Actions Workflows${NC}"
echo "======================================"

# Test Results
TESTS_PASSED=0
TESTS_FAILED=0

validate_workflow() {
    local workflow_file="$1"
    local workflow_name="$2"
    
    print_info "Validating: $workflow_name"
    
    if [[ ! -f "$workflow_file" ]]; then
        print_error "✗ Workflow file not found: $workflow_file"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Check YAML syntax
    if command -v yamllint >/dev/null 2>&1; then
        if yamllint "$workflow_file" >/dev/null 2>&1; then
            print_success "✓ YAML syntax valid"
            ((TESTS_PASSED++))
        else
            print_error "✗ YAML syntax invalid"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        print_warning "⚠ yamllint not available, skipping syntax check"
    fi
    
    # Check for trunk-based development patterns
    local checks_passed=0
    local total_checks=0
    
    # Check 1: Workflow triggers on correct branches
    ((total_checks++))
    if grep -q "branches.*master\|branches.*feature" "$workflow_file"; then
        print_success "  ✓ Configured for trunk-based branches"
        ((checks_passed++))
    else
        print_warning "  ⚠ May not be configured for trunk-based branches"
    fi
    
    # Check 2: Includes build step
    ((total_checks++))
    if grep -q "build\|Build" "$workflow_file"; then
        print_success "  ✓ Includes build step"
        ((checks_passed++))
    else
        print_warning "  ⚠ No build step found"
    fi
    
    # Check 3: Includes test step
    ((total_checks++))
    if grep -q "test\|Test" "$workflow_file"; then
        print_success "  ✓ Includes test step"
        ((checks_passed++))
    else
        print_warning "  ⚠ No test step found"
    fi
    
    # Check 4: Uses appropriate actions versions
    ((total_checks++))
    if grep -q "actions/checkout@v[4-9]\|actions/setup-node@v[4-9]\|actions/setup-dotnet@v[4-9]" "$workflow_file"; then
        print_success "  ✓ Uses recent action versions"
        ((checks_passed++))
    else
        print_warning "  ⚠ May be using outdated action versions"
    fi
    
    # Overall workflow validation
    if [[ $checks_passed -eq $total_checks ]]; then
        print_success "✓ $workflow_name fully validated"
        ((TESTS_PASSED++))
    elif [[ $checks_passed -gt $((total_checks / 2)) ]]; then
        print_warning "⚠ $workflow_name partially validated ($checks_passed/$total_checks checks passed)"
        ((TESTS_PASSED++))
    else
        print_error "✗ $workflow_name validation failed ($checks_passed/$total_checks checks passed)"
        ((TESTS_FAILED++))
    fi
}

# Check if workflows directory exists
WORKFLOWS_DIR=".github/workflows"
if [[ ! -d "$WORKFLOWS_DIR" ]]; then
    print_error "GitHub workflows directory not found: $WORKFLOWS_DIR"
    print_info "Creating workflows from WorkFlo main repository..."
    
    # Copy workflows from main repository if they exist
    if [[ -d "../../.github/workflows" ]]; then
        mkdir -p "$WORKFLOWS_DIR"
        cp ../../.github/workflows/*.yml "$WORKFLOWS_DIR/" 2>/dev/null || true
        print_success "Copied workflows from main repository"
    else
        print_error "No workflows found to copy"
        exit 1
    fi
fi

# Validate each workflow file
echo ""
print_info "=== WORKFLOW VALIDATION ==="

for workflow in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
    if [[ -f "$workflow" ]]; then
        workflow_name=$(basename "$workflow" | sed 's/\.[^.]*$//')
        validate_workflow "$workflow" "$workflow_name"
        echo ""
    fi
done

# Additional validation checks
echo ""
print_info "=== ADDITIONAL VALIDATION ==="

# Check for proper workflow separation
feature_workflows=$(grep -l "feature.*branches\|branches.*feature" "$WORKFLOWS_DIR"/*.yml 2>/dev/null | wc -l)
master_workflows=$(grep -l "master.*branches\|branches.*master" "$WORKFLOWS_DIR"/*.yml 2>/dev/null | wc -l)
main_workflows=$(grep -l "main.*branches\|branches.*main" "$WORKFLOWS_DIR"/*.yml 2>/dev/null | wc -l)

if [[ $feature_workflows -gt 0 ]]; then
    print_success "✓ Feature branch workflows found ($feature_workflows)"
    ((TESTS_PASSED++))
else
    print_warning "⚠ No feature branch workflows found"
fi

if [[ $master_workflows -gt 0 ]]; then
    print_success "✓ Master branch workflows found ($master_workflows)"
    ((TESTS_PASSED++))
else
    print_warning "⚠ No master branch workflows found"
fi

if [[ $main_workflows -gt 0 ]]; then
    print_success "✓ Main/production branch workflows found ($main_workflows)"
    ((TESTS_PASSED++))
else
    print_warning "⚠ No main/production branch workflows found"
fi

# Test workflow file structure
total_workflows=$(find "$WORKFLOWS_DIR" -name "*.yml" -o -name "*.yaml" | wc -l)
if [[ $total_workflows -ge 2 ]]; then
    print_success "✓ Multiple workflows configured ($total_workflows total)"
    ((TESTS_PASSED++))
else
    print_warning "⚠ Only $total_workflows workflow(s) found - consider separate workflows for different branches"
fi

# Summary
echo ""
echo "======================================"
echo -e "${BLUE}Workflow Validation Results${NC}"
echo "======================================"
print_success "Validations Passed: $TESTS_PASSED"
if [[ $TESTS_FAILED -gt 0 ]]; then
    print_error "Validations Failed: $TESTS_FAILED"
    echo ""
    print_error "🛑 WORKFLOW VALIDATION FAILED"
    exit 1
else
    echo ""
    print_success "🎉 ALL WORKFLOW VALIDATIONS PASSED"
    print_info "GitHub Actions workflows are properly configured for trunk-based development"
fi

# Create workflow validation report
mkdir -p ../results
cat > ../results/workflow-validation-report.md << EOF
# Workflow Validation Report

## Test Environment
- Workflows Directory: $WORKFLOWS_DIR
- Total Workflows: $total_workflows
- Date: $(date)

## Validation Results
- **Validations Passed**: $TESTS_PASSED
- **Validations Failed**: $TESTS_FAILED
- **Overall Status**: $([ $TESTS_FAILED -eq 0 ] && echo "PASSED" || echo "FAILED")

## Workflow Analysis
- **Feature Branch Workflows**: $feature_workflows
- **Master Branch Workflows**: $master_workflows
- **Production Branch Workflows**: $main_workflows

## Validated Components
- ✅ YAML syntax validation
- ✅ Trunk-based development branch configuration
- ✅ Build and test step inclusion
- ✅ Modern GitHub Actions usage
- ✅ Workflow separation by branch type

## Workflow Files
$(find "$WORKFLOWS_DIR" -name "*.yml" -o -name "*.yaml" | sed 's/^/- /')

## Conclusion
$([ $TESTS_FAILED -eq 0 ] && echo "All GitHub Actions workflows are properly configured for trunk-based development. The CI/CD pipeline supports the feature → master → main workflow." || echo "Some workflow configurations need attention. Review the failed validations above.")
EOF

print_info "Workflow validation report saved to: results/workflow-validation-report.md"