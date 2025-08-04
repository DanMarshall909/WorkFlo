# TESTING_PATTERNS.md

## Test Strategy (ESSENTIAL - Prevents Blocking)

```bash
# ✅ DURING TDD CYCLES: Run focused unit tests only
npm test -- --testPathPattern=auto-subcommand
npx jest tests/specific-feature.test.ts

# ❌ NEVER during TDD cycles: Integration tests, mutation tests, full test suites
# ✅ AT PR STAGE: Full integration + mutation testing
```

**Why**: Integration test failures unrelated to your current work will block TDD progression. Unit tests provide fast feedback on your specific changes.

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

## Test Generation System (Issue #204)

### flo-cli Test Generator
- **Location**: `flo-cli/src/test-generator.ts`
- **Command**: `flo-cli generate-tests --issue <number> --output <path>`
- **Features**: AST-based test insertion, multiple strategies, Jest/TypeScript output
- **Integration**: Works with GitHub issues via `gh` CLI
- **Validation**: Input validation, error handling, automatic directory creation
- **Testing**: Comprehensive edge case and error scenario coverage

### Usage Examples
```bash
# Generate tests from GitHub issue
flo-cli generate-tests --issue 204 --output tests/feature.test.ts

# Mark acceptance criteria complete
flo mark-ac 204 "Create CLI command for generation"
```

## Mutation Testing Changes

As of Issue #153, mutation testing has been moved from the TDD COVER phase to PR submission time. This change:

- Removes mutation testing from individual TDD cycles
- Runs mutation testing during PR creation for comprehensive validation
- Updates confidence scoring to use PR-time mutation results
- Maintains the 85% mutation testing threshold at PR level