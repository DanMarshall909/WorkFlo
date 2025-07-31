/**
 * GitHub client abstraction for testability
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

export interface GitHubClient {
  getIssueBody(issueNumber: number): Promise<string>;
  updateIssueBody(issueNumber: number, newBody: string): Promise<void>;
}

/**
 * Real GitHub CLI client
 */
export class GitHubCLIClient implements GitHubClient {
  async getIssueBody(issueNumber: number): Promise<string> {
    try {
      const issueData = execSync(`gh issue view ${issueNumber} --json body`, { 
        encoding: 'utf-8' 
      });
      const issue = JSON.parse(issueData);
      return issue.body;
    } catch (error: any) {
      throw new Error(`Failed to fetch issue #${issueNumber}: ${error.message}`);
    }
  }

  async updateIssueBody(issueNumber: number, newBody: string): Promise<void> {
    const tempFile = `/tmp/issue-${issueNumber}-body.md`;
    
    try {
      writeFileSync(tempFile, newBody);
      execSync(`gh issue edit ${issueNumber} --body-file ${tempFile}`);
      unlinkSync(tempFile);
    } catch (error: any) {
      // Clean up temp file on error
      try {
        unlinkSync(tempFile);
      } catch {}
      throw new Error(`Failed to update issue #${issueNumber}: ${error.message}`);
    }
  }
}

/**
 * Mock GitHub client for testing
 */
export class MockGitHubClient implements GitHubClient {
  private issues: Map<number, string> = new Map();

  constructor(initialIssues: Record<number, string> = {}) {
    for (const [number, body] of Object.entries(initialIssues)) {
      this.issues.set(parseInt(number), body);
    }
  }

  async getIssueBody(issueNumber: number): Promise<string> {
    const body = this.issues.get(issueNumber);
    if (!body) {
      throw new Error(`Issue #${issueNumber} not found`);
    }
    return body;
  }

  async updateIssueBody(issueNumber: number, newBody: string): Promise<void> {
    if (!this.issues.has(issueNumber)) {
      throw new Error(`Issue #${issueNumber} not found`);
    }
    this.issues.set(issueNumber, newBody);
  }

  // Test helpers
  getIssueBodySync(issueNumber: number): string | undefined {
    return this.issues.get(issueNumber);
  }

  setIssueBody(issueNumber: number, body: string): void {
    this.issues.set(issueNumber, body);
  }
}