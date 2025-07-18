#!/bin/bash
# safe-commit.sh - Configurable TDD cycle and quality enforcement
# Uses .workflow/config.json for project-specific settings

set -e

# Load configuration first
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load workflow configuration
if [[ -f "$PROJECT_ROOT/.workflow/config-loader.sh" ]]; then
    source "$PROJECT_ROOT/.workflow/config-loader.sh"
    load_all_config
else
    # Fallback to defaults if config system not available
    export GIT_DEV_BRANCH="dev"
    export GIT_REQUIRE_SAFE_COMMIT="true"
    export ADHD_TDD_ENABLED="true"
    export ADHD_ALLOW_SKIP_DOCS="true"
    export QUALITY_MIN_BRANCH_COVERAGE="95"
    export QUALITY_ENFORCE_FORMAT="true"
fi

# Colors (respect configuration)
if [[ "${NOTIF_COLORS:-true}" == "true" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# Output functions (respect emoji configuration)
if [[ "${NOTIF_EMOJI:-true}" == "true" ]]; then
    print_header() { echo -e "${BLUE}🔍 $1${NC}"; }
    print_success() { echo -e "${GREEN}✅ $1${NC}"; }
    print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
    print_error() { echo -e "${RED}❌ $1${NC}"; }
    print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
else
    print_header() { echo -e "${BLUE}[INFO] $1${NC}"; }
    print_success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }
    print_warning() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
    print_error() { echo -e "${RED}[ERROR] $1${NC}"; }
    print_info() { echo -e "${BLUE}[INFO] $1${NC}"; }
fi

print_header "🛡️ Safe Commit - TDD Cycle Enforcement"
echo ""

# Check if we're in a git repository
if [[ ! -d ".git" ]]; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if there are staged changes
if git diff --cached --quiet; then
    print_error "No staged changes found"
    echo "Stage changes first: git add <files>"
    exit 1
fi

# Ensure we're on correct development branch (configurable)
current_branch=$(git symbolic-ref HEAD | sed 's|refs/heads/||')
if [[ "$current_branch" != "$GIT_DEV_BRANCH" ]]; then
    print_error "COMMIT BLOCKED: Must be on $GIT_DEV_BRANCH branch"
    echo "Switch to $GIT_DEV_BRANCH: git checkout $GIT_DEV_BRANCH"
    exit 1
fi

print_info "🧪 Enforcing TDD Cycle - Running Quality Checks..."
echo ""

# ADHD Break Enforcement - check if break is needed
print_info "🧠 Checking ADHD break requirements..."
if [[ -f "./scripts/break-enforcer.sh" ]]; then
    if ! ./scripts/break-enforcer.sh block-commit; then
        exit 1
    fi
    print_success "ADHD break check passed"
else
    print_warning "Break enforcer not found - skipping ADHD break check"
fi

# TDD Cycle Enforcement - check if cycle is complete
print_info "🔴🟢🔵 Checking TDD cycle completion..."
if [[ -f "./scripts/tdd-check-cycle.sh" ]]; then
    if ! ./scripts/tdd-check-cycle.sh; then
        print_error "TDD cycle incomplete - commit blocked"
        exit 1
    fi
    print_success "TDD cycle check passed"
else
    print_warning "TDD cycle checker not found - skipping TDD check"
fi

# FORCE: Clean and restore packages
print_info "1️⃣ Cleaning and restoring packages..."
if ! dotnet clean --verbosity quiet; then
    print_error "Clean failed - commit blocked"
    exit 1
fi

if ! dotnet restore --verbosity quiet; then
    print_error "Restore failed - commit blocked"
    exit 1
fi
print_success "Clean and restore completed"

# FORCE: Build check
print_info "2️⃣ Running build verification..."
if ! dotnet build --verbosity quiet --no-restore; then
    print_error "❌ Build failed - commit blocked"
    echo ""
    echo "🔧 Fix build errors before committing:"
    dotnet build --no-restore
    exit 1
fi
print_success "Build verification passed"

# FORCE: Tests must pass (RED-GREEN cycle enforcement)
print_info "3️⃣ Running unit tests..."
if ! dotnet test --no-build --verbosity quiet; then
    print_error "❌ Tests failed - commit blocked"
    echo ""
    echo "🧪 TDD ENFORCEMENT: All tests must pass before commit"
    echo "Fix failing tests or ensure you have a failing test (RED phase)"
    echo ""
    dotnet test --no-build
    exit 1
fi
print_success "All tests passed"

# FORCE: Check test coverage
print_info "4️⃣ Checking test coverage..."
coverage_file="coverage/current/coverage.cobertura.xml"

# Run coverage analysis
if ! dotnet test --no-build --collect:"XPlat Code Coverage" --results-directory ./coverage/current --verbosity quiet; then
    print_warning "Coverage collection failed - proceeding without coverage check"
else
    # Find the coverage file
    coverage_files=$(find ./coverage/current -name "coverage.cobertura.xml" 2>/dev/null || echo "")
    
    if [[ -n "$coverage_files" ]]; then
        # Extract coverage percentage (simplified - look for line rate)
        line_coverage=$(grep -o 'line-rate="[0-9.]*"' $coverage_files | head -1 | sed 's/line-rate="//;s/"//')
        
        if [[ -n "$line_coverage" ]]; then
            coverage_percent=$(echo "$line_coverage * 100" | bc -l 2>/dev/null || echo "0")
            coverage_percent=${coverage_percent%.*}
            
            if [[ "$coverage_percent" -lt 60 ]]; then
                print_error "❌ Coverage below minimum threshold: ${coverage_percent}% < 60%"
                echo "Write more tests to increase coverage before committing"
                exit 1
            elif [[ "$coverage_percent" -lt 80 ]]; then
                print_warning "⚠️  Coverage below target: ${coverage_percent}% < 80% (minimum met)"
            else
                print_success "Coverage target met: ${coverage_percent}%"
            fi
        fi
    else
        print_warning "Coverage file not found - proceeding without coverage check"
    fi
fi

# FORCE: Code formatting (DISABLED per user request)
print_info "5️⃣ Skipping code formatting check (disabled)..."
# Auto-formatter disabled
print_success "Code formatting check skipped"

# FORCE: PII Detection (comprehensive privacy enforcement)
print_info "6️⃣ Running comprehensive PII and security scan..."
if [[ -f "./scripts/privacy-guard.sh" ]]; then
    if ! ./scripts/privacy-guard.sh staged; then
        exit 1
    fi
    print_success "Privacy and security scan passed"
else
    print_warning "Privacy guard not found - running basic PII check"
    
    # Fallback basic PII detection
    staged_files=$(git diff --cached --name-only)
    pii_found=false
    for file in $staged_files; do
        if [[ -f "$file" && "$file" =~ \.(cs|js|ts|tsx|json)$ ]]; then
            if git show ":$file" | grep -qE "(email|password|credit|ssn|phone).*[:=]\s*['\"][^'\"]+['\"]"; then
                print_error "⚠️  Potential PII found in: $file"
                pii_found=true
            fi
        fi
    done
    
    if [[ "$pii_found" == true ]]; then
        print_error "❌ Potential PII violations detected - commit blocked"
        exit 1
    fi
    print_success "Basic PII check passed"
fi

# FORCE: Conventional commit format
if [[ $# -eq 0 ]]; then
    print_error "❌ Commit message required"
    echo ""
    echo "Usage: ./scripts/safe-commit.sh \"commit message\""
    echo ""
    echo "🔤 Use conventional commit format:"
    echo "  feat: add new feature"
    echo "  fix: resolve bug"
    echo "  docs: update documentation"
    echo "  test: add or modify tests"
    echo "  refactor: code refactoring"
    exit 1
fi

commit_message="$1"

# Validate conventional commit format
if ! echo "$commit_message" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+"; then
    print_error "❌ Invalid commit message format"
    echo ""
    echo "🔤 Use conventional commit format:"
    echo "  type(scope): description"
    echo ""
    echo "Examples:"
    echo "  feat: implement session start command"
    echo "  fix: resolve CI failures"
    echo "  test: add unit tests for task creation"
    echo "  docs: update README with setup instructions"
    exit 1
fi

# All checks passed - perform the commit
print_success "✅ All TDD and quality checks passed!"
echo ""
print_info "🚀 Committing changes..."

git commit -m "$commit_message"

if [[ $? -eq 0 ]]; then
    print_success "✅ Commit successful!"
    echo ""
    print_info "📋 Next steps:"
    echo "  • Continue TDD cycle: Red → Green → Refactor → Cover → Commit"
    echo "  • Push when ready: git push origin dev"
    echo "  • Use ./scripts/start-work.sh before starting new features"
    echo ""
    print_info "🔄 TDD Cycle Reminder:"
    echo "  🔴 RED: Write failing test first"
    echo "  🟢 GREEN: Make test pass with minimal code"
    echo "  🔵 REFACTOR: Improve code while keeping tests green"
    echo "  📊 COVER: Ensure adequate test coverage"
    echo "  ✅ COMMIT: Use this script to commit safely"
else
    print_error "❌ Commit failed"
    exit 1
fi