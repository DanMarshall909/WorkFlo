/**
 * GitHub client abstraction for testability
 */
export interface GitHubClient {
    getIssueBody(issueNumber: number): Promise<string>;
    updateIssueBody(issueNumber: number, newBody: string): Promise<void>;
}
/**
 * Real GitHub CLI client
 */
export declare class GitHubCLIClient implements GitHubClient {
    getIssueBody(issueNumber: number): Promise<string>;
    updateIssueBody(issueNumber: number, newBody: string): Promise<void>;
}
/**
 * Mock GitHub client for testing
 */
export declare class MockGitHubClient implements GitHubClient {
    private issues;
    constructor(initialIssues?: Record<number, string>);
    getIssueBody(issueNumber: number): Promise<string>;
    updateIssueBody(issueNumber: number, newBody: string): Promise<void>;
    getIssueBodySync(issueNumber: number): string | undefined;
    setIssueBody(issueNumber: number, body: string): void;
}
//# sourceMappingURL=github-client.d.ts.map