/**
 * Mock GitHub Client for testing
 */

export interface GitHubClient {
  getIssue(issueNumber: number): Promise<any>;
  updateIssue(issueNumber: number, body: string): Promise<void>;
}

export class MockGitHubClient implements GitHubClient {
  private issues = new Map<number, any>();

  constructor() {
    // Initialize with test data
    this.issues.set(204, {
      number: 204,
      title: 'Parse and validate acceptance criteria from GitHub issues',
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

  async getIssue(issueNumber: number): Promise<any> {
    const issue = this.issues.get(issueNumber);
    if (!issue) {
      throw new Error(`Issue #${issueNumber} not found`);
    }
    return issue;
  }

  async updateIssue(issueNumber: number, body: string): Promise<void> {
    const issue = this.issues.get(issueNumber);
    if (!issue) {
      throw new Error(`Issue #${issueNumber} not found`);
    }
    issue.body = body;
    this.issues.set(issueNumber, issue);
  }

  // Test helpers
  setMockIssue(issue: any): void {
    this.issues.set(issue.number, issue);
  }

  getMockIssue(issueNumber: number): any {
    return this.issues.get(issueNumber);
  }

  reset(): void {
    this.issues.clear();
    // Re-initialize with test data
    this.issues.set(204, {
      number: 204,
      title: 'Parse and validate acceptance criteria from GitHub issues',
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
}