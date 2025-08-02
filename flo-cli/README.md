# flo-cli

> **Note**: This CLI has been refactored from commander.js to oclif. If you're upgrading from a previous version, please see [MIGRATION.md](./MIGRATION.md) for breaking changes.

A command-line interface for the WorkFlo project management system.

## Installation

```bash
npm install -g flo-cli
```

## Usage

```bash
# View all commands
flo-cli --help

# Parse acceptance criteria
flo-cli parse-ac 123
flo-cli parse-ac --body "- [ ] First criteria"

# Generate tests
flo-cli generate-tests 123 tests/output.test.ts

# Update issue
flo-cli update-issue-ac 123 "Criteria text"

# Auto workflow commands
flo-cli auto:status
flo-cli auto:init 123
flo-cli auto:run 123
```

## Commands

### `parse-ac`
Parse acceptance criteria from a GitHub issue.

### `generate-tests`
Generate test files from GitHub issue acceptance criteria.

### `update-issue-ac`
Update acceptance criteria status in a GitHub issue.

### `auto:status`
Show current auto workflow status.

### `auto:init`
Initialize TDD session and auto workflow state.

### `auto:run`
Run autonomous TDD workflow for multiple acceptance criteria.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## License

ISC