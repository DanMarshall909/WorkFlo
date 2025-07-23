#!/bin/bash

# verify-trunk-migration.sh - Verify trunk-based development migration completeness
# Checks for remaining dev branch references and validates GitHub configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 WorkFlo Trunk-Based Development Migration Verification${NC}"
echo "================================================================"

# Track verification results
ISSUES_FOUND=0

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((ISSUES_FOUND++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ISSUES_FOUND++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Check for hardcoded dev branch references in scripts
echo ""
print_info "Checking for hardcoded 'dev' branch references in scripts..."

DEV_REFS=$(grep -r "checkout dev\|origin dev\|merge dev\|push.*dev\|pull.*dev" scripts/ 2>/dev/null | grep -v "\.git" | grep -v "WORKFLO_MAIN_BRANCH" | grep -v "migrate-to-trunk-based" | grep -v "npm.*dev" || true)

if [[ -n "$DEV_REFS" ]]; then
    print_error "Found hardcoded 'dev' branch references:"
    echo "$DEV_REFS"
else
    print_success "No hardcoded 'dev' branch references found in scripts"
fi

# 2. Check for proper WORKFLO_MAIN_BRANCH usage
echo ""
print_info "Validating WORKFLO_MAIN_BRANCH environment variable usage..."

SCRIPTS_USING_ENV_VAR=$(grep -l "WORKFLO_MAIN_BRANCH" scripts/*.sh 2>/dev/null || true)
SCRIPTS_WITH_BRANCHES=$(grep -l "checkout\|origin\|branch" scripts/*.sh 2>/dev/null | grep -v "migrate-to-trunk-based" || true)

if [[ -n "$SCRIPTS_USING_ENV_VAR" ]]; then
    print_success "Scripts using WORKFLO_MAIN_BRANCH: $(echo $SCRIPTS_USING_ENV_VAR | wc -w)"
else
    print_warning "No scripts found using WORKFLO_MAIN_BRANCH environment variable"
fi

# 3. Check GitHub repository configuration
echo ""
print_info "Checking GitHub repository configuration..."

if command -v gh &> /dev/null; then
    DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || echo "unknown")
    
    if [[ "$DEFAULT_BRANCH" == "master" ]]; then
        print_success "GitHub default branch is correctly set to 'master'"
    elif [[ "$DEFAULT_BRANCH" == "main" ]]; then
        print_warning "GitHub default branch is 'main' - should be 'master' for trunk-based development"
    else
        print_error "Unable to determine GitHub default branch or unexpected value: $DEFAULT_BRANCH"
    fi
else
    print_warning "GitHub CLI not available - cannot verify repository configuration"
fi

# 4. Check for GitHub Actions workflows
echo ""
print_info "Checking GitHub Actions workflows..."

if [[ -d ".github/workflows" ]]; then
    WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
    if [[ $WORKFLOW_COUNT -gt 0 ]]; then
        print_success "Found $WORKFLOW_COUNT GitHub Actions workflow(s)"
        
        # Check for trunk-based workflow patterns
        if grep -r "branches.*master\|branches.*feature" .github/workflows/ &>/dev/null; then
            print_success "Workflows configured for trunk-based development (master/feature branches)"
        else
            print_warning "Workflows may not be configured for trunk-based development"
        fi
    else
        print_warning "No GitHub Actions workflows found"
    fi
else
    print_warning "No .github/workflows directory found"
fi

# 5. Check documentation consistency
echo ""
print_info "Checking documentation consistency..."

if grep -q "trunk-based development" CLAUDE.md; then
    print_success "CLAUDE.md mentions trunk-based development"
else
    print_warning "CLAUDE.md may not document trunk-based development properly"
fi

if grep -q "master.*trunk\|feature.*master" CLAUDE.md; then
    print_success "CLAUDE.md documents master as trunk branch"
else
    print_warning "CLAUDE.md may not clearly document master as trunk branch"
fi

# 6. Check for PROGRESS.md migration status
echo ""
print_info "Checking migration progress documentation..."

if grep -q "trunk-based.*complete\|migration.*complete" PROGRESS.md 2>/dev/null; then
    print_success "PROGRESS.md indicates migration completion"
else
    print_warning "PROGRESS.md may not reflect migration completion status"
fi

# 7. Test environment variable configuration
echo ""
print_info "Testing environment variable configuration..."

TARGET_BRANCH="${WORKFLO_MAIN_BRANCH:-master}"
if [[ "$TARGET_BRANCH" == "master" ]]; then
    print_success "Environment variable defaults to 'master' (trunk-based)"
else
    print_warning "Environment variable defaults to '$TARGET_BRANCH' - expected 'master'"
fi

# Summary
echo ""
echo "================================================================"
if [[ $ISSUES_FOUND -eq 0 ]]; then
    print_success "🎉 TRUNK-BASED DEVELOPMENT MIGRATION VERIFICATION PASSED!"
    echo -e "${GREEN}All checks passed. The migration appears to be complete and properly configured.${NC}"
    exit 0
else
    print_error "🛑 FOUND $ISSUES_FOUND ISSUE(S) IN MIGRATION"
    echo -e "${YELLOW}Please review the warnings and errors above to complete the migration.${NC}"
    exit 1
fi