#!/bin/bash

# setup-test-repo.sh - Create isolated test repository for trunk-based development validation
# This creates a complete test environment without affecting the main WorkFlo repository

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

echo -e "${BLUE}🧪 WorkFlo Test Harness Setup${NC}"
echo "================================="

# Create test repository directory
TEST_REPO_DIR="test-harness/test-repo"
if [[ -d "$TEST_REPO_DIR" ]]; then
    print_warning "Test repository already exists. Removing..."
    rm -rf "$TEST_REPO_DIR"
fi

mkdir -p "$TEST_REPO_DIR"
cd "$TEST_REPO_DIR"

print_info "Creating isolated test repository..."

# Initialize git repository
git init
git config user.name "Test User"
git config user.email "test@workflo.dev"

print_success "Initialized test git repository"

# Create basic project structure
mkdir -p {src,scripts,tests,.github/workflows}

# Create sample source files
cat > src/main.js << 'EOF'
// Sample main application file
console.log('WorkFlo Test Application');

function greetUser(name) {
    return `Hello, ${name}! Welcome to WorkFlo.`;
}

module.exports = { greetUser };
EOF

cat > tests/main.test.js << 'EOF'
const { greetUser } = require('../src/main');

test('greetUser returns greeting message', () => {
    expect(greetUser('Developer')).toBe('Hello, Developer! Welcome to WorkFlo.');
});
EOF

cat > package.json << 'EOF'
{
  "name": "workflo-test-harness",
  "version": "1.0.0",
  "description": "Test harness for WorkFlo trunk-based development",
  "main": "src/main.js",
  "scripts": {
    "test": "jest",
    "dev": "node src/main.js",
    "build": "echo 'Build completed'"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
EOF

# Copy WorkFlo scripts for testing (without modifying originals)
cp -r ../../../scripts/* scripts/ 2>/dev/null || true

# Create CLAUDE.md with legacy dev branch configuration
cat > CLAUDE.md << 'EOF'
# CLAUDE.md - Test Repository

This is a test repository for validating trunk-based development migration.

## Current Workflow (Pre-Migration)
- dev branch: Main development branch
- main branch: Production branch
- feature branches: Short-lived development branches

## Scripts
- Use ./scripts/safe-commit.sh for commits
- Use ./scripts/create-feature-branches.sh for branch management
EOF

# Create initial commit on dev branch (simulating legacy workflow)
git checkout -b dev
git add .
git commit -m "feat: initial test repository setup with legacy dev branch workflow"

# Create main branch for production
git checkout -b main
git commit --allow-empty -m "feat: initial production branch"

# Create some history to simulate real repository
git checkout dev
echo "console.log('Feature 1 added');" >> src/main.js
git add src/main.js
git commit -m "feat: add feature 1"

echo "console.log('Feature 2 added');" >> src/main.js
git add src/main.js
git commit -m "feat: add feature 2"

print_success "Created test repository with legacy dev branch workflow"

# Create test scenarios directory structure
cd ../../
mkdir -p test-scenarios/{dev-to-trunk-migration,feature-branch-workflow,ci-cd-validation}
mkdir -p validation results/{test-logs,reports}

print_info "Created test harness directory structure"

# Create summary
cat > test-repo-summary.md << 'EOF'
# Test Repository Summary

## Current State
- **Default Branch**: dev (legacy workflow)
- **Production Branch**: main
- **Sample Commits**: 3 commits with realistic development history
- **Structure**: Basic Node.js project with tests

## Available for Testing
- Migration from dev → master trunk-based workflow
- Safe commit script behavior testing
- Feature branch workflow validation
- CI/CD pipeline testing

## Next Steps
1. Run migration validation: `./validation/test-migration.sh`
2. Test safe commit behavior: `./validation/test-safe-commit.sh`
3. Validate GitHub Actions: `./validation/validate-workflows.sh`
EOF

print_success "Test harness setup complete!"
print_info "Test repository created at: $(pwd)/test-repo"
print_info "Use the validation scripts in ./validation/ to test migration scenarios"

echo ""
echo "================================================================"
print_success "🎉 TEST HARNESS READY FOR VALIDATION"
echo -e "${BLUE}Next: Create validation scripts to test migration scenarios${NC}"