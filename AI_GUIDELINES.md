# AI_GUIDELINES.md

This file contains core guidelines for all AI agents working with the WorkFlo repository.

## Ultra-Minimal Self-Contained TDD Workflow

This repository enforces **ONE acceptance criteria at a time** with hard stops to prevent AI agents from "running off" and doing multiple things.

### Core Constraint

**🚫 HARD RULE: Work on exactly ONE acceptance criteria, write ONE test, then STOP.**

**✅ SELF-CONTAINED: No manual git/gh commands needed - everything is automated.**

### Complete Self-Contained Workflow

```bash
# 1. Create issue with acceptance criteria (if needed)
./board create

# 2. Start TDD workflow for a GitHub issue  
./tdd start <issue_number>

# 3. Follow the enforced TDD cycle (auto-commits, auto-updates board):
./tdd red        # Write ONE failing test for current criteria
./tdd green      # Minimal implementation to pass the test  
./tdd refactor   # Improve code quality (optional)
./tdd cover      # Add comprehensive test coverage + mutation testing
./tdd next       # Move to next criteria (HARD STOP - must be explicit)

# 4. Check current status
./tdd status
./board list     # See board with TDD phases

# Issue automatically completed when all criteria done!
```

### TDD Cycle Enforcement

**Required sequence (no skipping allowed):**
1. **RED** → Write ONE failing test for current acceptance criteria
2. **GREEN** → Minimal implementation to make test pass
3. **REFACTOR** → Improve code quality (optional)
4. **COVER** → Add comprehensive tests + mutation testing (85% threshold)
5. **NEXT** → Hard stop, must explicitly continue to next criteria

### Progressive Disclosure

- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue
- All phases result in commits with structured messages

### Quality Gates & Automation

- **Tests must pass** before advancing phases
- **Mutation testing** required in COVER phase (85% threshold)
- **Automatic commits** for each TDD phase with structured messages
- **Automatic board updates** track TDD phase progress
- **Automatic issue completion** when all criteria finished
- **No manual git/gh commands** required by user
- **No skipping** of TDD phases allowed

### Issue Format Required

GitHub issues must have acceptance criteria in this format:

```markdown
- [ ] First acceptance criteria
- [ ] Second acceptance criteria  
- [ ] Third acceptance criteria
```

### Repository Structure

- `./tdd` - Ultra-minimal TDD command (main workflow)
- `./board` - GitHub board management (auto-creates board)
- `legacy/` - All previous complex scripts (archived)
- `.tdd-state` - Current session state (auto-managed)

## Key Principles

1. **Tunnel Vision**: Only current criteria visible to AI
2. **Hard Stops**: Explicit commands required between criteria
3. **Phase Enforcement**: Must follow RED→GREEN→REFACTOR→COVER→NEXT
4. **Quality First**: Mutation testing and comprehensive coverage required
5. **Complete Automation**: No manual git/gh commands needed
6. **Self-Contained**: Focus only on writing tests and code
7. **Minimal Complexity**: Two simple scripts replace entire complex system

## Prerequisites

- GitHub CLI (`gh`) with authentication
- `jq` for JSON processing: `sudo apt-get install jq`
- `bc` for calculations: `sudo apt-get install bc`
- .NET SDK for running tests and mutation testing

This system is designed to constrain AI agents to focused, high-quality development with built-in stops to prevent scope creep. The workflow is completely self-contained - AI agents never need to run git, gh, or board management commands manually.

## CLI Development Patterns

### Commander.js Subcommand Structure
Established patterns for extending CLI tools with new subcommands:

```typescript
// Flexible argument handling - optional when using flags
program
  .command('auto')
  .description('Autonomous TDD workflow for issues with multiple acceptance criteria')
  .argument('[issue]', 'GitHub issue number')  // Optional argument
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

### Key CLI Principles
- **Optional arguments**: Use `[arg]` instead of `<arg>` when argument should be optional for certain flags
- **Early validation**: Validate inputs immediately with descriptive error messages
- **Status vs action separation**: Use options for status/mode flags rather than separate subcommands
- **Test against built dist/**: Always test compiled JavaScript, not TypeScript source
- **Comprehensive coverage**: Test help output, error scenarios, and positive cases
- **User-friendly messaging**: Provide clear, informative output for all scenarios