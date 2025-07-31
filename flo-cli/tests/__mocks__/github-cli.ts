/**
 * Mock GitHub CLI for testing
 */

export interface MockIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
}

// Mock issue database
const mockIssues: Map<number, MockIssue> = new Map();

// Initialize with test data
mockIssues.set(204, {
  number: 204,
  title: 'Parse and validate acceptance criteria from GitHub issues',
  state: 'open',
  body: `Create functionality to parse and validate acceptance criteria from GitHub issues for automation workflows.

## Acceptance Criteria

### Parser (AC 1-5)
- [x] Create function to parse acceptance criteria from issue body
- [ ] Handle various markdown checkbox formats (- [ ], * [ ], etc.)
- [ ] Return structured data with AC index, text, and checked status
- [ ] Extract AC-N prefix when present (e.g., "AC-1: Do something")
- [x] Create CLI command for parsing: \`flo-cli parse-ac\`

### TypeScript Test Generator (AC 6-9)
- [ ] Create TypeScript/Jest test generator consuming parser output
- [x] Generate describe blocks with issue number and AC text
- [x] Include @group annotations for jest-runner-groups
- [ ] Create CLI command for generation: \`flo-cli generate-tests\``
});

mockIssues.set(999, {
  number: 999,
  title: 'Test Issue with No ACs',
  state: 'open',
  body: `This is a test issue with no acceptance criteria.

Just some regular content without checkboxes.`
});

/**
 * Mock execSync function that simulates gh CLI commands
 */
export function mockExecSync(command: string, options?: any): string {
  const cmd = command.trim();
  
  // Mock: gh issue view <number> --json body
  const issueViewMatch = cmd.match(/^gh issue view (\d+) --json body$/);
  if (issueViewMatch) {
    const issueNumber = parseInt(issueViewMatch[1]);
    const issue = mockIssues.get(issueNumber);
    
    if (!issue) {
      throw new Error(`Issue #${issueNumber} not found`);
    }
    
    return JSON.stringify({ body: issue.body });
  }
  
  // Mock: gh issue edit <number> --body-file <file>
  const issueEditMatch = cmd.match(/^gh issue edit (\d+) --body-file (.+)$/);
  if (issueEditMatch) {
    const issueNumber = parseInt(issueEditMatch[1]);
    const bodyFile = issueEditMatch[2];
    
    const issue = mockIssues.get(issueNumber);
    if (!issue) {
      throw new Error(`Issue #${issueNumber} not found`);
    }
    
    // Read the body from the mock file system
    const newBody = mockFileSystem.get(bodyFile);
    if (!newBody) {
      throw new Error(`File not found: ${bodyFile}`);
    }
    
    // Update the mock issue
    issue.body = newBody;
    mockIssues.set(issueNumber, issue);
    
    return ''; // gh issue edit returns empty on success
  }
  
  throw new Error(`Unmocked command: ${cmd}`);
}

/**
 * Mock file system for testing
 */
const mockFileSystem: Map<string, string> = new Map();

/**
 * Mock fs.writeFileSync
 */
export function mockWriteFileSync(filePath: string, content: string): void {
  mockFileSystem.set(filePath, content);
}

/**
 * Mock fs.unlinkSync
 */
export function mockUnlinkSync(filePath: string): void {
  mockFileSystem.delete(filePath);
}

/**
 * Get mock issue for testing
 */
export function getMockIssue(number: number): MockIssue | undefined {
  return mockIssues.get(number);
}

/**
 * Update mock issue for testing
 */
export function setMockIssue(issue: MockIssue): void {
  mockIssues.set(issue.number, issue);
}

/**
 * Reset mock state
 */
export function resetMocks(): void {
  mockFileSystem.clear();
  // Reset to initial state
  mockIssues.clear();
  mockIssues.set(204, {
    number: 204,
    title: 'Parse and validate acceptance criteria from GitHub issues',
    state: 'open',
    body: `Create functionality to parse and validate acceptance criteria from GitHub issues for automation workflows.

## Acceptance Criteria

### Parser (AC 1-5)
- [x] Create function to parse acceptance criteria from issue body
- [ ] Handle various markdown checkbox formats (- [ ], * [ ], etc.)
- [ ] Return structured data with AC index, text, and checked status
- [ ] Extract AC-N prefix when present (e.g., "AC-1: Do something")
- [x] Create CLI command for parsing: \`flo-cli parse-ac\`

### TypeScript Test Generator (AC 6-9)
- [ ] Create TypeScript/Jest test generator consuming parser output
- [x] Generate describe blocks with issue number and AC text
- [x] Include @group annotations for jest-runner-groups
- [ ] Create CLI command for generation: \`flo-cli generate-tests\``
  });
}