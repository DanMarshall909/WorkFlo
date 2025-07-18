# TDD Workflow Scripts

Automated scripts to ensure consistent Test-Driven Development workflow across the project.

## 🎯 Purpose

These scripts enforce the mandatory TDD workflow with:
- ✅ **95% coverage requirement** 
- ✅ **Standardized directory structure**
- ✅ **Quality gate validation**
- ✅ **Consistent commit messages with metrics**
- ✅ **Progress tracking integration**

## 📋 Scripts Overview

### Phase 1: Setup
```bash
scripts/tdd-phase-1-setup.sh FEATURE_NAME [BASE_DIR]
```
- Creates directory structure for new feature
- Sets up types, components, tests directories
- Updates progress tracker

### Phase 2: Type Validation  
```bash
scripts/tdd-phase-2-types.sh FEATURE_NAME [BASE_DIR]
```
- Validates TypeScript compilation
- Runs initial test suite
- Checks coverage baseline
- **Requires**: Types file and test file already created

### Phase 3: Quality Gates
```bash
scripts/tdd-phase-3-quality.sh FEATURE_NAME [COVERAGE_THRESHOLD]
```
- Validates 95% coverage requirement (configurable)
- Runs comprehensive test suite
- Performs code quality checks (linting)
- Analyzes test quality metrics
- **Enforces**: No commits without passing quality gates

### Phase 4: Commit
```bash
scripts/tdd-phase-4-commit.sh FEATURE_NAME "description"
```
- Creates standardized commit with quality metrics
- Includes coverage percentages in commit message
- Updates progress tracker
- **Auto-generates**: Claude Code attribution

### Complete Cycle
```bash
scripts/tdd-complete-cycle.sh FEATURE_NAME "description"
```
- Runs Phases 2-4 in sequence
- **Use when**: Types and tests already exist

### Progress Tracking
```bash
scripts/update-progress.sh ACTION "description" FEATURE_NAME [--commit]
```
- Updates PROGRESS.md with standardized entries
- Collects quality metrics automatically
- Optional auto-commit with `--commit` flag

## 🔄 Workflow Example

### New Feature (Complete Flow)
```bash
# 1. Setup structure
scripts/tdd-phase-1-setup.sh session-timer

# 2. Create your types and tests files manually
# - src/web/src/lib/types/session-timer.ts
# - src/web/src/__tests__/lib/types/session-timer.test.ts

# 3. Validate and commit
scripts/tdd-phase-2-types.sh session-timer
scripts/tdd-phase-3-quality.sh session-timer  
scripts/tdd-phase-4-commit.sh session-timer "implement session timer foundation types"
```

### Existing Feature (Quick Validation)
```bash
# Run complete cycle for existing implementation
scripts/tdd-complete-cycle.sh session-timer "session timer foundation types with TDD"
```

## 📊 Quality Metrics Collected

The scripts automatically collect and report:
- **Test Count**: Number of test cases
- **Statement Coverage**: % of code statements tested
- **Branch Coverage**: % of code branches tested  
- **Function Coverage**: % of functions tested
- **Boundary Tests**: Count of edge case tests

## 🚫 Quality Gates

Scripts will **FAIL** if:
- Coverage below 95% (configurable)
- TypeScript compilation errors
- Linting errors
- Test failures
- Missing required files

## 🎓 Learning Integration

Each script provides educational output about:
- **Why** each step is important for TDD
- **What** quality metrics mean
- **How** to improve test coverage
- **Best practices** for TypeScript patterns

## 📁 Directory Structure Created

```
src/web/src/
├── lib/types/           # TypeScript type definitions
├── components/FEATURE/  # React components  
├── hooks/              # Custom React hooks
└── __tests__/
    ├── lib/types/      # Type definition tests
    ├── components/     # Component tests
    └── hooks/          # Hook tests
```

## 🔧 Configuration

### Coverage Thresholds
Default: 95% - modify in `tdd-phase-3-quality.sh`

### Base Directory
Default: `src/web/src` - override with second parameter

### Progress Tracking
Automatic integration with `PROGRESS.md` - requires file to exist

## 🤖 Integration with Claude Code

Scripts are designed for use with Claude Code and include:
- Standardized commit message format
- Claude Code attribution
- Progress tracking for context
- Educational explanations for ADHD-friendly learning