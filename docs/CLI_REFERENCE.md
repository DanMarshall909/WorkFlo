# CLI Reference

WorkFlo command-line interface provides powerful automation tools for TDD workflows and project management.

## Installation

```bash
# Build the CLI
npm run build

# Use the CLI
node dist/cli.js [command] [options]
```

## Commands

### `auto:run` - Autonomous TDD Workflow

Run autonomous TDD workflow for multiple acceptance criteria with intelligent PR automation.

#### Syntax
```bash
flo auto:run <issue> [options]
```

#### Arguments
- `issue` - GitHub issue number (required)

#### Core Options
| Flag | Description | Example |
|------|-------------|---------|
| `--parse-only` | Parse issue and show acceptance criteria count only | `--parse-only` |
| `--json` | Output structured JSON for machine parsing | `--json` |
| `--criteria <value>` | Target specific criteria (e.g., 3 or 2-4) | `--criteria 3` |
| `--from <value>` | Start from specific criteria number | `--from 2` |
| `--to <value>` | End at specific criteria number | `--to 5` |
| `--execute` | Execute full TDD cycle automation | `--execute` |
| `--monitor` | Show real-time progress monitoring | `--monitor` |
| `--dry-run` | Validate workflow without execution | `--dry-run` |

#### PR Automation Options
| Flag | Description | Example |
|------|-------------|---------|
| `--auto-pr` | Automatically create PR after successful completion (default) | `--auto-pr` |
| `--no-pr` | Skip PR creation entirely | `--no-pr` |
| `--draft-pr` | Create PR as draft for work-in-progress | `--draft-pr` |
| `--pr-template <name>` | Use specific PR template | `--pr-template feature` |
| `--assign-reviewers` | Auto-assign reviewers based on code changes | `--assign-reviewers` |

#### Examples

**Basic Usage**
```bash
# Parse issue and show acceptance criteria
flo auto:run 325 --parse-only

# Execute full workflow with auto-PR
flo auto:run 325 --execute --auto-pr

# Target specific criteria range
flo auto:run 325 --criteria 2-4 --execute
```

**PR Automation**
```bash
# Skip PR creation
flo auto:run 325 --execute --no-pr

# Create draft PR with reviewer assignment
flo auto:run 325 --execute --draft-pr --assign-reviewers

# Use custom template
flo auto:run 325 --execute --pr-template hotfix
```

**Validation and Monitoring**
```bash
# Dry-run validation
flo auto:run 325 --dry-run --auto-pr

# Monitor execution progress
flo auto:run 325 --execute --monitor

# JSON output for integration
flo auto:run 325 --parse-only --json
```

#### Flag Validation

**Conflicting Combinations** (will error):
- `--no-pr` with any other PR flag (`--auto-pr`, `--draft-pr`, `--pr-template`, `--assign-reviewers`)
- `--criteria` with `--from` or `--to`

**Valid Combinations**:
- `--draft-pr` + `--assign-reviewers`
- `--pr-template` + any other PR flag (except `--no-pr`)
- `--criteria` with range syntax: `--criteria 2-4`

### `tdd:*` - Manual TDD Commands

Individual TDD phase commands for manual workflow control.

#### Available Commands
- `tdd:start <issue>` - Initialize TDD session for issue
- `tdd:red` - Write failing test (RED phase)
- `tdd:green` - Implement minimal solution (GREEN phase)  
- `tdd:refactor` - Improve code quality (REFACTOR phase)
- `tdd:cover` - Add comprehensive tests (COVER phase)
- `tdd:next` - Move to next acceptance criteria
- `tdd:status` - Show current TDD session status

#### Examples
```bash
# Start TDD for issue
flo tdd:start 325

# Follow TDD cycle
flo tdd:red
flo tdd:green
flo tdd:refactor
flo tdd:cover
flo tdd:next
```

### `auto:status` - Workflow Status

Check the status of autonomous workflows and TDD sessions.

```bash
flo auto:status
```

### `auto:init` - Initialize TDD Session

Initialize a TDD session for a specific issue.

```bash
flo auto:init <issue>
```

### `qc` - Quality Control

Run comprehensive quality checks including build validation, unit tests, and mutation testing.

```bash
flo qc
```

**Quality Gates**:
- ✅ Build validation (compile/lint)
- ✅ Unit test execution  
- ✅ Mutation testing (80%+ threshold)
- ❌ Any failure blocks PR approval

**Node.js Projects**: Automatically includes mutation testing if `stryker.conf.json` exists.

## Global Options

Most commands support these global options:

| Flag | Description |
|------|-------------|
| `--help` | Show command help |
| `--version` | Show CLI version |

## Configuration

### PR Templates

Place custom PR templates in `.workflo/templates/pr/`:
- `feature.md` - Feature development
- `bugfix.md` - Bug fixes
- `refactor.md` - Code refactoring
- `hotfix.md` - Urgent fixes

### Reviewer Rules

Configure automatic reviewer assignment in `.workflo/config.json`:

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
    },
    "templates": {
      "default": "feature",
      "mappings": {
        "bug": "bugfix",
        "hotfix": "hotfix"
      }
    }
  }
}
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments or conflicting flags |
| 3 | TDD workflow error |
| 4 | GitHub API error |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TDD_OVERRIDE` | Disable TDD enforcement (emergency use) | `false` |
| `GITHUB_TOKEN` | GitHub API token | None |
| `WORKFLO_CONFIG` | Path to config file | `.workflo/config.json` |

## Examples

### Complete Workflow Examples

**Feature Development with PR**
```bash
# 1. Parse and validate issue
flo auto:run 325 --parse-only

# 2. Execute with custom template and reviewers
flo auto:run 325 --execute --pr-template feature --assign-reviewers

# 3. Check status
flo auto:status
```

**Bug Fix Workflow**
```bash
# Quick bug fix with draft PR
flo auto:run 326 --execute --draft-pr --pr-template bugfix
```

**Large Feature with Staged Development**
```bash
# Work on specific criteria range
flo auto:run 327 --criteria 1-3 --execute --draft-pr

# Continue with remaining criteria
flo auto:run 327 --criteria 4-7 --execute --auto-pr
```

## Troubleshooting

### Common Issues

**Tests Failing**
```bash
# Check TDD status
flo tdd:status

# Run tests manually
npm test
```

**PR Creation Fails**
```bash
# Verify GitHub token
echo $GITHUB_TOKEN

# Check repository permissions
gh auth status
```

**Flag Conflicts**
```bash
# Error: Cannot use --no-pr with --auto-pr
# Solution: Use either --no-pr OR --auto-pr, not both
flo auto:run 325 --execute --auto-pr  # ✅ Correct
```

### Debug Mode

Enable verbose logging:
```bash
DEBUG=* flo auto:run 325 --execute
```

## Integration

### GitHub Actions
```yaml
- name: Run WorkFlo Automation
  run: |
    flo auto:run ${{ github.event.issue.number }} --execute --auto-pr
```

### VS Code Extension
The WorkFlo VS Code extension provides GUI access to CLI commands with status monitoring and progress tracking.

## Migration from Legacy Scripts

Legacy bash scripts are being replaced by this TypeScript CLI:

| Legacy Script | New CLI Command |
|---------------|-----------------|
| `./flo` | `flo auto:run` |
| `./tdd start` | `flo tdd:start` |
| `./tdd red` | `flo tdd:red` |
| `./board create` | `flo board:create` |