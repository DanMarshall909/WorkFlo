# PR Automation Workflow

This document describes the PR automation system implemented in WorkFlo, providing intelligent pull request creation after successful autonomous workflows.

## Overview

The PR automation system automatically creates pull requests after TDD workflow completion, with intelligent description generation, template selection, and reviewer assignment based on code changes.

## Command Interface

### Basic Usage

```bash
# Enable auto-PR (default behavior)
flo auto:run 325 --execute --auto-pr

# Skip PR creation entirely
flo auto:run 325 --execute --no-pr

# Create as draft PR for work-in-progress
flo auto:run 325 --execute --draft-pr

# Use specific PR template
flo auto:run 325 --execute --pr-template feature

# Auto-assign reviewers based on code changes
flo auto:run 325 --execute --assign-reviewers
```

### Flag Combinations

```bash
# Combine multiple PR options
flo auto:run 325 --execute --draft-pr --assign-reviewers --pr-template custom

# Validate workflow without execution
flo auto:run 325 --dry-run --auto-pr
```

## PR Automation Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--auto-pr` | Automatically create PR after successful completion (default) | `--auto-pr` |
| `--no-pr` | Skip PR creation entirely | `--no-pr` |
| `--draft-pr` | Create PR as draft for work-in-progress | `--draft-pr` |
| `--pr-template <name>` | Use specific PR template | `--pr-template feature` |
| `--assign-reviewers` | Auto-assign reviewers based on code changes | `--assign-reviewers` |

## Flag Validation

The system enforces proper flag usage:

### Conflicting Flags
- `--no-pr` conflicts with all other PR flags
- Cannot combine `--no-pr` with `--auto-pr`, `--draft-pr`, `--pr-template`, or `--assign-reviewers`

### Valid Combinations
- `--draft-pr` + `--assign-reviewers` ✅
- `--pr-template` + `--draft-pr` ✅
- `--auto-pr` + `--assign-reviewers` ✅

## Features

### 1. Intelligent PR Description Generation
- **AI-Enhanced**: Uses LLM to generate contextual PR descriptions
- **Template-Based**: Variable substitution and conditional sections
- **Context-Aware**: Analyzes code changes and issue content

### 2. Smart Template System
- **Issue Type Aware**: Different templates for bugs, features, refactoring
- **Size Adaptive**: Adjusts complexity based on change size
- **Configurable**: Easy customization for different teams/projects

### 3. Automatic Linking
- **Related Issues**: Automatically detects and links related issues
- **Dependencies**: Links to dependent/related PRs and issues
- **Milestone Association**: Automatic milestone linking

### 4. Smart Branch Naming
- **Configurable Patterns**: Customizable branch naming conventions
- **Issue-Based**: Automatically includes issue numbers
- **Type-Aware**: Prefixes based on change type (feature/, fix/, etc.)

### 5. Reviewer Assignment
- **Code Analysis**: Based on files changed and code ownership
- **Team Rules**: Configurable assignment rules
- **Expertise Matching**: Assigns reviewers based on code expertise

### 6. GitHub Integration
- **Advanced Labeling**: Intelligent label assignment based on changes
- **Project Boards**: Automatic addition to appropriate project boards
- **Status Checks**: Sets up required status checks and validations

## Workflow Integration

### With Autonomous TDD
```bash
# Complete workflow with auto-PR
flo auto:run 325 --execute --auto-pr

# Output:
# 🚀 Starting TDD execution
# 📊 Processing 7 acceptance criteria for issue #325
# 
# 🎯 Starting criteria 1: Automatically create PRs...
# 🔴 RED phase: Writing failing test...
# ✅ RED phase completed
# 🟢 GREEN phase: Implementing minimal solution...
# ✅ GREEN phase completed
# 🔵 REFACTOR phase: Improving code quality...
# ✅ REFACTOR phase completed
# 📊 COVER phase: Adding comprehensive tests...
# ✅ COVER phase completed
# ✅ Criteria 1 completed successfully
# 
# [... continues for all criteria ...]
# 
# 🎉 All criteria completed successfully!
# ✅ TDD cycle automation finished
# 📝 Starting comprehensive code review process...
# 📋 Analyzing code changes...
# 📊 Found 5 changed files (+150/-25 lines)
# 🎯 Change type: feature, Impact: medium
# 🔍 Running comprehensive quality checks...
# 🔧 Build validation...
# ✅ Build passed
# 🧪 Running unit tests...
# ✅ Unit tests passed
# 🧬 Running mutation testing...
# ✅ Mutation tests passed - test quality meets standards
# 📝 Generating intelligent PR description...
# 🚀 Creating Pull Request...
# ✅ Pull Request created successfully!
# 📋 Title: feat: auto command enhancements (Issue #325)
# 🔗 Review: Check your GitHub repository for the new PR
```

### With Dry-Run Validation
```bash
# Validate PR workflow without execution
flo auto:run 325 --dry-run --auto-pr

# Output:
# 🔍 Dry-run validation
# ✅ Workflow validated successfully for 7 criteria
# 
# Validation results:
# 1. Automatically create PRs after successful autonomous workflow completion - ✅ Valid
# 2. Generate intelligent PR descriptions using AI/templates - ✅ Valid
# [... continues for all criteria ...]
```

## Error Handling

### Conflicting Flags
```bash
flo auto:run 325 --no-pr --auto-pr
# Error: Cannot use --no-pr with --auto-pr

flo auto:run 325 --no-pr --draft-pr
# Error: Cannot use --no-pr with --draft-pr
```

### Invalid Templates
```bash
flo auto:run 325 --pr-template nonexistent
# Error: PR template 'nonexistent' not found
```

## Configuration

### PR Templates
Templates are stored in `.workflo/templates/pr/`:
- `feature.md` - Feature development template
- `bugfix.md` - Bug fix template
- `refactor.md` - Refactoring template
- `hotfix.md` - Hotfix template

### Reviewer Rules
Configure in `.workflo/config.json`:
```json
{
  "pr": {
    "reviewers": {
      "rules": [
        {
          "pattern": "src/commands/**",
          "reviewers": ["@cli-team"]
        },
        {
          "pattern": "tests/**",
          "reviewers": ["@qa-team"]
        }
      ]
    }
  }
}
```

## Testing

All PR automation functionality is covered by comprehensive tests:

```bash
# Run PR automation tests
npm test -- tests/pr-automation.test.ts

# Test specific functionality
npm test -- --testNamePattern="PR automation flags"
npm test -- --testNamePattern="PR automation validation"
```

## Best Practices

1. **Use Draft PRs** for work-in-progress that needs early feedback
2. **Custom Templates** for special project requirements
3. **Reviewer Assignment** to ensure proper code review coverage
4. **Dry-Run Validation** before executing large workflows
5. **Template Customization** for team-specific requirements

## Future Enhancements

- **Change Impact Analysis**: Estimate risk level and impact
- **Test Coverage Integration**: Include coverage deltas in PR descriptions
- **Documentation Generation**: Auto-update docs when needed
- **Multi-Repository Support**: Support for monorepo workflows
- **Quality Metrics**: Include code quality metrics in PR descriptions