# TypeScript Best Practices

**🎯 CRITICAL: AI agents MUST follow these TypeScript best practices when working with any TypeScript code in this repository.**

This document establishes coding standards and patterns for TypeScript development to ensure type safety, maintainability, and consistency.

## Error Handling

### ❌ Never Use `any` for Error Handling
```typescript
// BAD - Reduces type safety
} catch (error: any) {
  console.error(`Error: ${error.message}`);
}
```

### ✅ Proper Error Handling Patterns

**Pattern 1: Unknown with Type Guards**
```typescript
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Error: ${message}`);
}
```

**Pattern 2: String Coercion**
```typescript
} catch (error) {
  console.error(`Error: ${String(error)}`);
}
```

**Pattern 3: Custom Error Handler**
```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

try {
  // risky operation
} catch (error) {
  console.error(`Error: ${getErrorMessage(error)}`);
}
```

## Type Safety Rules

### 1. Avoid `any` Type
- **Never** use `any` except in extreme legacy migration scenarios
- Use `unknown` for truly unknown data, then narrow with type guards
- Use proper generic constraints instead of `any`

### 2. Strict Type Annotations
```typescript
// ✅ Good - Explicit return types for functions
function validateIssueNumber(issueStr: string): number {
  const issueNumber = parseInt(issueStr);
  if (!issueNumber || issueNumber <= 0) {
    throw new Error(`Invalid issue number: ${issueStr}`);
  }
  return issueNumber;
}

// ✅ Good - Proper parameter typing
interface CommandOptions {
  status?: boolean;
  issue?: string;
}

function handleCommand(issue: string | undefined, options: CommandOptions): void {
  // Implementation
}
```

### 3. Union Types and Type Guards
```typescript
// ✅ Good - Use union types instead of any
type CommandResult = 
  | { success: true; data: string }
  | { success: false; error: string };

function isSuccessResult(result: CommandResult): result is { success: true; data: string } {
  return result.success === true;
}
```

## CLI Development Patterns

### 1. Commander.js with TypeScript
```typescript
import { Command } from 'commander';

interface AutoCommandOptions {
  status?: boolean;
}

program
  .command('auto')
  .description('Autonomous TDD workflow for issues with multiple acceptance criteria')
  .argument('[issue]', 'GitHub issue number')
  .option('--status', 'Show current auto workflow progress checking')
  .action(async (issue: string | undefined, options: AutoCommandOptions) => {
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
      // Continue with implementation
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
```

### 2. Async/Await Error Handling
```typescript
// ✅ Good - Proper async error handling
async function fetchGitHubIssue(issueNumber: string, fields: string = 'body'): Promise<GitHubIssue> {
  try {
    const issueData = execSync(`gh issue view ${issueNumber} --json ${fields}`, { encoding: 'utf-8' });
    return JSON.parse(issueData) as GitHubIssue;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch GitHub issue ${issueNumber}: ${message}`);
  }
}
```

## Configuration Files

### tsconfig.json Standards
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Testing Patterns

### 1. Type-Safe Test Utilities
```typescript
// ✅ Good - Typed test helpers
function expectCommandOutput(command: string, expectedPattern: RegExp): void {
  const output = execSync(command, { encoding: 'utf8' });
  expect(output).toMatch(expectedPattern);
}

// ✅ Good - Proper test error handling
it('should handle invalid issue number', () => {
  expect(() => {
    execSync('node dist/cli.js auto invalid', { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
  }).toThrow(); // or use specific error matching
});
```

### 2. Mock Typing
```typescript
// ✅ Good - Properly typed mocks
interface MockGitHubClient {
  fetchIssue: jest.MockedFunction<(issue: string) => Promise<GitHubIssue>>;
}

const mockClient: MockGitHubClient = {
  fetchIssue: jest.fn()
};
```

## Import/Export Standards

### 1. Explicit Exports
```typescript
// ✅ Good - Named exports with types
export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
}

export function parseAcceptanceCriteria(issueBody: string): string[] {
  // Implementation
}
```

### 2. Import Organization
```typescript
// Standard library imports
import * as fs from 'fs';
import * as path from 'path';

// Third-party imports
import { program } from 'commander';
import { execSync } from 'child_process';

// Local imports
import { parseAcceptanceCriteria } from './acceptance-criteria-parser';
import { validateIssueNumber } from './utils';

// Type-only imports
import type { GitHubIssue, CommandOptions } from './types';
```

## Performance Considerations

### 1. Lazy Loading for CLI Tools
```typescript
// ✅ Good - Import heavy dependencies only when needed
async function handleGenerateCommand(): Promise<void> {
  const { generateTests } = await import('./test-generator');
  // Use generateTests
}
```

### 2. Proper Resource Cleanup
```typescript
// ✅ Good - Explicit resource management
function processFile(filePath: string): void {
  let handle: fs.promises.FileHandle | undefined;
  
  try {
    handle = fs.openSync(filePath, 'r');
    // Process file
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'File processing failed';
    throw new Error(message);
  } finally {
    if (handle) {
      fs.closeSync(handle);
    }
  }
}
```

## Documentation Standards

### 1. JSDoc with TypeScript
```typescript
/**
 * Validates and parses a GitHub issue number string
 * @param issueStr - The issue number as a string
 * @returns The parsed issue number
 * @throws {Error} When the issue number is invalid or non-positive
 */
function validateIssueNumber(issueStr: string): number {
  const issueNumber = parseInt(issueStr, 10);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error(`Invalid issue number: ${issueStr}`);
  }
  return issueNumber;
}
```

## Code Review Checklist

When reviewing TypeScript code, verify:

- [ ] No usage of `any` type
- [ ] Proper error handling with `unknown` and type guards
- [ ] Explicit return type annotations for public functions
- [ ] Consistent import organization
- [ ] Type-safe test implementations
- [ ] Proper async/await error handling
- [ ] Resource cleanup in finally blocks
- [ ] JSDoc documentation for public APIs

## Migration Guidelines

When converting JavaScript to TypeScript:

1. **Start with strict mode enabled**
2. **Replace `any` with proper types progressively**
3. **Add explicit return types to functions**
4. **Use type guards for runtime type checking**
5. **Implement proper error handling patterns**

---

**Remember**: The goal is not just type safety, but maintainable, readable, and robust code that leverages TypeScript's full potential while avoiding common pitfalls.