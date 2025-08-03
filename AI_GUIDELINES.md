# AI_GUIDELINES.md

**🤖 CRITICAL: AI agents MUST read this file at the start of every session.**

This file contains core guidelines optimized for AI agents working with any development repository.


## Best Practices

- don't try to continue using a workaround if a script in this project doesn't work. fix it!

## TypeScript Development Standards

**🎯 MANDATORY: All AI agents MUST follow [TYPESCRIPT_BEST_PRACTICES.md](TYPESCRIPT_BEST_PRACTICES.md) when working with TypeScript code.**

Key requirements:
- **NEVER use `any` type** - Use `unknown` with type guards for error handling
- **Proper error handling patterns** - Always use type-safe error handling
- **Explicit type annotations** - Provide return types for functions
- **Strict TypeScript configuration** - Maintain high type safety standards

See [TYPESCRIPT_BEST_PRACTICES.md](TYPESCRIPT_BEST_PRACTICES.md) for complete guidelines and examples.

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
flo mark-ac 204 "Create CLI command for generation"
```

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

## Ultra-Minimal Self-Contained TDD Workflow

This repository enforces **ONE acceptance criteria at a time** with hard stops to prevent AI agents from "running off" and doing multiple things.

### Core Constraint

**🚫 HARD RULE: Work on exactly ONE acceptance criteria, write ONE test, then STOP.**

**✅ SELF-CONTAINED: No manual git/gh commands needed - everything is automated through flo.**

**🚫 DISABLE DIRECT GITHUB COMMANDS: All GitHub operations MUST use flo workflow automation.**

### Complete Self-Contained Workflow

```bash
# 1. Create issue with acceptance criteria (if needed)
flo board:create

# 2. Start TDD workflow for a GitHub issue  
flo tdd:start <issue_number>

# 3. Follow the enforced TDD cycle (auto-commits, auto-updates board):
flo tdd:red        # 🔴 Write ONE failing test for current criteria
flo tdd:green      # 🟢 Minimal implementation to pass the test  
flo tdd:refactor   # 🔵 Improve code quality (optional)
flo tdd:cover      # 📊 Add comprehensive test coverage (unit tests only)
flo tdd:document   # 📝 Document learnings for future AI agents
flo tdd:next       # ➡️ Move to next criteria (HARD STOP - must be explicit)

# 4. Check current status
flo tdd:status
flo board:list     # See board with TDD phases

# Issue automatically completed when all criteria done!
```

### TDD Cycle Enforcement

**Required sequence (no skipping allowed):**
1. **🔴 RED** → Write ONE failing test for current acceptance criteria
2. **🟢 GREEN** → Minimal implementation to make test pass
3. **🔵 REFACTOR** → Improve code quality (optional)  
4. **📊 COVER** → Add comprehensive unit tests (integration tests at PR stage)
5. **📝 DOCUMENT** → Document learnings and patterns for future AI agents
6. **➡️ NEXT** → Hard stop, must explicitly continue to next criteria

### Progressive Disclosure

- Only ONE acceptance criteria is visible at a time
- Hard stops between criteria prevent scope creep
- Each phase requires explicit command to continue
- All phases result in commits with structured messages

### Quality Gates & Automation

- **Unit tests must pass** before advancing phases
- **Integration tests + mutation testing** run at PR stage (not during TDD cycles)
- **Automatic commits** for each TDD phase with structured messages (🔴RED, 🟢GREEN, etc.)
- **Automatic board updates** track TDD phase progress  
- **Automatic issue completion** when all criteria finished
- **No manual git/gh commands** required by user - all automated through flo
- **No skipping** of TDD phases allowed

### Issue Format Required

GitHub issues must have acceptance criteria in this format:

```markdown
- [ ] First acceptance criteria
- [ ] Second acceptance criteria  
- [ ] Third acceptance criteria
```

### Repository Structure

- `flo-cli/` - TypeScript CLI application (main workflow)
- `./tdd` - Legacy TDD script (being migrated to TypeScript)
- `.tdd-state` - Current session state (auto-managed)

## Key Principles

1. **Tunnel Vision**: Only current criteria visible to AI
2. **Hard Stops**: Explicit commands required between criteria
3. **Phase Enforcement**: Must follow RED→GREEN→REFACTOR→COVER→NEXT
4. **Quality First**: Mutation testing and comprehensive coverage required
5. **Complete Automation**: No manual git/gh commands needed
6. **Self-Contained**: Focus only on writing tests and code
7. **Minimal Complexity**: TypeScript CLI replaces complex shell scripts

## Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher) for TypeScript CLI
- GitHub CLI (`gh`) with authentication
- `jq` for JSON processing: `sudo apt-get install jq`
- `bc` for calculations: `sudo apt-get install bc`
- .NET SDK for running tests and mutation testing

This system is designed to constrain AI agents to focused, high-quality development with built-in stops to prevent scope creep. The workflow is completely self-contained - AI agents never need to run git, gh, or board management commands manually.

## 🚫 GitHub Command Restrictions

**CRITICAL: All GitHub operations MUST be automated through the flo workflow system.**

### Disabled Direct Commands
```bash
# ❌ NEVER use these commands directly:
gh pr create                    # Use: flo auto:run --auto-pr
gh pr merge                     # Use: flo workflow automation
gh issue create                 # Use: flo board:create
gh issue close                  # Use: flo workflow automation
git commit                      # Use: flo tdd:red/green/refactor/cover
git push                        # Use: flo workflow automation
git merge                       # Use: flo workflow automation
git checkout -b                 # Use: flo tdd:start (auto-creates branches)
```

### Required flo Automation
```bash
# ✅ Use flo automation instead:
flo auto:run <issue> --auto-pr           # Creates PR automatically
flo auto:run <issue> --no-pr             # Skip PR creation  
flo auto:run <issue> --draft-pr          # Create draft PR
flo tdd:red/green/refactor/cover         # Auto-commits with proper messages
flo board:create                         # Creates issues with acceptance criteria
flo tdd:start <issue>                    # Auto-creates branches and initializes
```

### Enforcement Policy
- **AI agents MUST use flo commands** for all GitHub operations
- **Direct gh/git commands are DISABLED** except for read-only operations
- **Workflow automation ensures consistency** and prevents manual errors
- **All commits, PRs, and issue management automated** through flo system

### Read-Only Operations (Allowed)
```bash
# ✅ Read-only commands are still allowed:
git status                      # Check repository status
git log                         # View commit history
gh issue view <number>          # Read issue details
gh pr list                      # List pull requests
git diff                        # View changes
```

## 🚨 Critical AI Agent Rules

### Test Strategy (ESSENTIAL - Prevents Blocking)
```bash
# ✅ DURING TDD CYCLES: Run focused unit tests only
npm test -- --testPathPattern=auto-subcommand
npx jest tests/specific-feature.test.ts

# ❌ NEVER during TDD cycles: Integration tests, mutation tests, full test suites
# ✅ AT PR STAGE: Full integration + mutation testing
```

**Why**: Integration test failures unrelated to your current work will block TDD progression. Unit tests provide fast feedback on your specific changes.

### Git Workflow Patterns  
```bash
# Each AC should complete full cycle before next AC
AC1: RED→GREEN→REFACTOR→COVER→DOCUMENT→[PR→REVIEW→MERGE]
AC2: RED→GREEN→REFACTOR→COVER→DOCUMENT→[PR→REVIEW→MERGE]

# OR accumulate ACs on feature branch, then single PR
AC1,AC2,AC3 → Single PR with all ACs
```

### Commit Message Patterns (AI-Optimized)
```bash
# Use emoji prefixes for visual parsing
🔴RED: criteria 1 - Add auto subcommand
🟢GREEN: criteria 1 - implement minimal auto command  
🔵REFACTOR: criteria 1 - improve error handling
📊COVER: criteria 1 - add comprehensive test coverage
📝DOCUMENT: criteria 1 - document CLI patterns
```

### Error Recovery Patterns
```typescript
// Standard AI-safe error handling
try {
  const result = await operation();
  console.log(`✅ Success: ${result}`);
} catch (error: any) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1); // For CLI tools - clean failure
}
```

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

### CLI Testing Patterns (AI-Optimized)
**🔧 Always test against built output, never source:**

```typescript
// ✅ Test command availability  
const helpOutput = execSync('node dist/cli.js --help', { encoding: 'utf8' });
expect(helpOutput).toContain('auto');

// ✅ Test command execution with regex patterns (flexible)
const output = execSync('node dist/cli.js auto --status', { encoding: 'utf8' });
expect(output).toMatch(/status|progress|workflow/i);

// ✅ Test error scenarios with stdio control (prevents noise)
expect(() => {
  execSync('node dist/cli.js auto --help', { encoding: 'utf8', stdio: 'pipe' });
}).not.toThrow();

// ✅ Test structure for AI agents
describe('AC-3: Add auto status command', () => {
  it('should handle status without issue number', () => {
    // Given - When - Then structure (AI-friendly)
    const output = execSync('node dist/cli.js auto --status', { encoding: 'utf8' });
    expect(output).toMatch(/no.*active|not.*running/i);
  });
});
```

### Key CLI Principles
- **Optional arguments**: Use `[arg]` instead of `<arg>` when argument should be optional for certain flags
- **Early validation**: Validate inputs immediately with descriptive error messages
- **Status vs action separation**: Use options for status/mode flags rather than separate subcommands
- **Test against built dist/**: Always test compiled JavaScript, not TypeScript source
- **Comprehensive coverage**: Test help output, error scenarios, and positive cases
- **User-friendly messaging**: Provide clear, informative output for all scenarios

## AST Manipulation Patterns (Safe Code Generation)

### TypeScript AST with ts-morph (Recommended)
**🛡️ Never use string concatenation for code generation:**

```typescript
import { Project, SourceFile } from 'ts-morph';

// ✅ Safe AST manipulation
const project = new Project();
const sourceFile = project.addSourceFileAtPath(filePath);

// Insert test at end of describe block
const describeDeclaration = sourceFile.getFirstDescendantByKind(SyntaxKind.CallExpression);
const testCode = `
  it('should handle new scenario', () => {
    // Given - When - Then
    expect(true).toBe(true);
  });
`;
describeDeclaration.insertText(testCode);

// Save changes
sourceFile.saveSync();
```

### Code Generation Strategies (AI-Safe)
```typescript
// Four strategies for test insertion (use appropriate one):
1. 'new-file'        // Create entirely new test file
2. 'insert-before-end' // Add to existing describe block  
3. 'insert-at-marker' // Use comment markers
4. 'insert-new-describe' // Add new describe blocks

// Choose based on existing code structure
if (existingTestFile) {
  strategy = 'insert-before-end';
} else {
  strategy = 'new-file';
}
```

## AI Agent Optimization Tips

### 🧠 Cognitive Load Reduction
```markdown
# Use visual indicators for quick scanning
✅ Do this     ❌ Don't do this
🔧 Tool/Command  📝 Documentation  
🚨 Critical     ⚠️ Warning
📊 Testing      🛡️ Safety
```

### 🎯 Pattern Recognition
```typescript
// Consistent patterns AI can quickly identify
interface StandardResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Predictable error handling
const handleResult = (result: StandardResponse) => {
  if (!result.success) {
    console.error(`❌ ${result.error}`);
    process.exit(1);
  }
  console.log(`✅ ${result.message}`);
};
```

### 🔄 Repetition Optimization
```bash
# Common commands AI agents use frequently
alias build="npm run build"
alias test-unit="npx jest --testPathPattern" 
alias test-cli="npm run build && npx jest tests/cli"

# Save AI cognitive cycles on repeated patterns
```