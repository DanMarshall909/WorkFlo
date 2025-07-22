# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the WorkFlo repository - an AI-powered workflow enforcement and development assistant.

## Repository Overview

WorkFlo is a comprehensive workflow automation and development assistant that enforces best practices through shell scripts and CI/CD integrations. The system provides automated quality checks, test-driven development workflows, and intelligent workflow management.

## Branching Strategy

This repository follows a **trunk-based development** workflow with the following structure:

- **master** (trunk): The main development branch where all feature branches merge
- **main**: Production branch (protected, no direct pushes allowed)
- **feature branches**: Short-lived branches for feature development (format: `feature/<issue>-<description>`)
- **test branches**: Optional branches for complex features (format: `test/<issue>-<subissue>-<description>`)

### Workflow Process

1. Create a feature branch from master:
   ```bash
   git checkout -b feature/123-add-new-feature
   ```

2. Make changes and commit regularly using the safe-commit script:
   ```bash
   ./scripts/safe-commit.sh "feat: add new functionality"
   ```

3. When ready, create a PR to merge feature → master:
   ```bash
   gh pr create --base master
   ```

4. After review and approval, merge to master
5. Periodically, master is promoted to main (production) through a separate PR process

### Branch Protection Rules

- **main branch**: Fully protected, requires PR with approvals
- **master branch**: Requires quality checks to pass before merge
- **Direct pushes**: Only allowed to feature and test branches

## Key Scripts and Tools

### Workflow Management
- `sw` (enhanced-start-work.sh): Initialize work on a new issue
- `sc` (safe-commit.sh): Commit with automatic quality checks
- `merge-to-main.sh`: Merge changes to the main development branch
- `dev-workflow.sh`: Manages the complete development workflow

### Quality Assurance
- `analyze-complexity.sh`: Analyze code complexity
- `check-quality.sh`: Run comprehensive quality checks
- Pre-commit hooks: Automatic linting and testing

### TDD Support
- `complete-subissue.sh`: Complete test-driven development subtasks
- `create-feature-branches.sh`: Set up feature branch structure
- Test branch workflow for complex features

## Working with Claude Code

When working on this repository:

1. **Always use the provided scripts** - They enforce quality standards and prevent common mistakes
2. **Follow the branching strategy** - Create feature branches for all changes
3. **Run tests before committing** - Use the safe-commit script which includes automatic testing
4. **Update documentation** - Keep README files and inline comments current
5. **Use semantic commit messages** - Follow conventional commits format

## Environment Configuration

The repository supports configuration through environment variables:

- `WORKFLO_MAIN_BRANCH`: Specifies the main development branch (defaults to "master")
- Scripts automatically detect and use the appropriate branch configuration

## Quality Standards

All code must meet the following standards:
- Pass all automated tests
- Maintain or improve code coverage
- Follow established code style guidelines
- Include appropriate documentation
- Pass complexity analysis thresholds

## Common Tasks

### Starting New Work
```bash
./scripts/sw 123  # Start work on issue #123
```

### Committing Changes
```bash
./scripts/sc "feat: implement new feature"  # Safe commit with quality checks
```

### Creating a PR
```bash
gh pr create --base master --title "feat: implement issue #123"
```

### Running Quality Checks
```bash
./scripts/check-quality.sh  # Run all quality checks
```

## Troubleshooting

- If scripts fail, check the error messages for specific quality issues
- Ensure you're on a feature branch before making changes
- Use `git status` to verify branch and changes before committing
- Check PROGRESS.md for recent workflow changes and updates

## Migration Note

This repository recently migrated from a dev-branch workflow to trunk-based development. If you encounter references to "dev branch" in documentation or scripts, please update them to reflect the current master-based workflow.

# Memories and Learnings

## Development Workflow Memories

- Use the notify script to open reviews and other large MD files from now on. if you're done with a long running task you can also use the notify to display a message
- Use these scripts for all summaries (display here too) and questions. For questions include hotkeys (1,2,3 etc)