# WorkFlo Test Harness

This test harness validates the trunk-based development migration without affecting the main repository.

## Purpose

- Test migration scripts in isolation
- Validate workflow changes before applying to production
- Verify GitHub Actions and CI/CD pipeline configurations
- Test safe-commit script behavior across different branch scenarios

## Test Repository Structure

```
test-harness/
├── README.md                    # This file
├── setup-test-repo.sh          # Script to create isolated test repository
├── test-scenarios/             # Pre-defined test scenarios
│   ├── dev-to-trunk-migration/ # Simulate dev→trunk migration
│   ├── feature-branch-workflow/ # Test feature branch development
│   └── ci-cd-validation/       # Test GitHub Actions workflows
├── validation/                 # Validation scripts
│   ├── test-safe-commit.sh     # Test safe-commit behavior
│   ├── test-migration.sh       # Test migration scripts
│   └── validate-workflows.sh   # Validate CI/CD workflows
└── results/                    # Test execution results
    ├── test-logs/              # Execution logs
    └── reports/                # Validation reports
```

## Usage

1. **Setup Test Repository**:
   ```bash
   ./test-harness/setup-test-repo.sh
   ```

2. **Run Migration Tests**:
   ```bash
   ./test-harness/validation/test-migration.sh
   ```

3. **Test Safe Commit Behavior**:
   ```bash
   ./test-harness/validation/test-safe-commit.sh
   ```

4. **Validate Workflows**:
   ```bash
   ./test-harness/validation/validate-workflows.sh
   ```

## Test Scenarios

### Scenario 1: Dev to Trunk Migration
- Simulates repository with dev branch workflow
- Tests migration scripts and validation
- Verifies proper configuration changes

### Scenario 2: Feature Branch Workflow
- Tests feature branch creation and commits
- Validates safe-commit script behavior
- Tests merge workflows

### Scenario 3: CI/CD Pipeline Validation
- Tests GitHub Actions workflow configurations
- Validates build and test processes
- Tests artifact creation and deployment

## Benefits

- **Safe Testing**: No risk to production repository
- **Comprehensive Coverage**: Tests all migration aspects
- **Repeatable**: Can run tests multiple times
- **Documentation**: Provides examples for other teams
- **Confidence**: Validates changes before production deployment