# CLAUDE.md

This file provides guidance to Claude Code when working with the WorkFlo repository.

## Mandatory Reading. CRITICAL!

YOU MUST read [AI_GUIDELINES.md](AI_GUIDELINES.md) at the start of every session.

## Best Practices

- don't try to continue using a workaround if a script doesn't work. fix it!

## Test Generation System (Issue #204)

As of Issue #204, the repository includes a comprehensive TypeScript test generator system:

### flo-cli Test Generator
- **Location**: `flo-cli/src/test-generator.ts`
- **Command**: `flo-cli generate-tests --issue <number> --output <path>`
- **Features**: AST-based test insertion, multiple strategies, Jest/TypeScript output
- **Integration**: Works with GitHub issues via `gh` CLI
- **Validation**: Input validation, error handling, automatic directory creation
- **Testing**: Comprehensive edge case and error scenario coverage

### AST-Based Test Insertion
The test generator supports four insertion strategies:
- `new-file`: Create new test files
- `insert-before-end`: Insert into existing describe blocks
- `insert-at-marker`: Insert at comment markers
- `insert-new-describe`: Add new describe blocks

### Usage Examples
```bash
# Generate tests from GitHub issue
flo-cli generate-tests --issue 204 --output tests/feature.test.ts

# Mark acceptance criteria complete
flo-mark-ac 204 "Create CLI command for generation"
```

## CLI Development Patterns (Issue #250)

### Commander.js Subcommand Structure
Established patterns for extending flo-cli with new subcommands:

```typescript
// Flexible argument handling - optional when using flags
program
  .command('auto')
  .description('Autonomous TDD workflow for issues with multiple acceptance criteria')
  .argument('[issue]', 'GitHub issue number')
  .option('--status', 'Show current auto workflow progress checking')
  .action(async (issue, options) => {
    try {
      if (options.status) {
        // Handle status-only operation
        console.log('No active auto workflow running');
        return;
      }
      
      if (!issue) {
        console.error('Error: Issue number is required');
        process.exit(1);
      }
      
      const issueNumber = validateIssueNumber(issue);
      // Continue with main functionality
      
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });
```

### CLI Testing Patterns
Use execSync for testing built CLI output:

```typescript
// Test command availability
const helpOutput = execSync('node dist/cli.js --help', { encoding: 'utf8' });
expect(helpOutput).toContain('auto');

// Test command execution
const output = execSync('node dist/cli.js auto --status', { encoding: 'utf8' });
expect(output).toMatch(/status|progress|workflow/i);

// Test error scenarios with stdio control
expect(() => {
  execSync('node dist/cli.js auto --help', { encoding: 'utf8', stdio: 'pipe' });
}).not.toThrow();
```

### Key Patterns
- **Optional arguments**: Use `[arg]` instead of `<arg>` when argument should be optional for certain flags
- **Early validation**: Validate inputs immediately with descriptive error messages
- **Status vs action separation**: Use options for status/mode flags rather than separate subcommands
- **Test against built dist/**: Always test compiled JavaScript, not TypeScript source
- **Comprehensive coverage**: Test help output, error scenarios, and positive cases

## TDD Workflow Issue (Issue #250)

**CRITICAL**: Integration tests should run at PR stage, not during individual TDD cycles.

**Current Problem**: TDD system runs BATS integration tests + mutation tests during development, blocking individual criteria progress.

**Correct Separation**:
- **TDD Cycles**: Unit tests only (focused, fast feedback)
- **PR Stage**: Full integration tests + mutation tests + comprehensive validation

**Solution Needed**: Configure TDD workflow to separate unit testing from integration testing phases.

## Mutation Testing Changes

As of Issue #153, mutation testing has been moved from the TDD COVER phase to PR submission time. This change:

- Removes mutation testing from individual TDD cycles
- Runs mutation testing during PR creation for comprehensive validation
- Updates confidence scoring to use PR-time mutation results
- Maintains the 85% mutation testing threshold at PR level