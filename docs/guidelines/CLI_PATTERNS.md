# CLI_PATTERNS.md

## Commander.js Subcommand Structure

### Flexible Argument Handling
```typescript
program
  .command('auto')
  .description('Autonomous TDD workflow for issues with multiple acceptance criteria')
  .argument('[issue]', 'GitHub issue number')  // Optional argument
  .option('--status', 'Show current auto workflow progress checking')
  .action(async (issue, options) => {
    try {
      if (options.status) {
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

### Common Commands
```bash
# Common commands AI agents use frequently
alias build="npm run build"
alias test-unit="npx jest --testPathPattern" 
alias test-cli="npm run build && npx jest tests/cli"
```