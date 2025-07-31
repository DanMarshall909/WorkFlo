"use strict";
/**
 * GitHub client abstraction for testability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockGitHubClient = exports.GitHubCLIClient = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
/**
 * Real GitHub CLI client
 */
class GitHubCLIClient {
    async getIssueBody(issueNumber) {
        try {
            const issueData = (0, child_process_1.execSync)(`gh issue view ${issueNumber} --json body`, {
                encoding: 'utf-8'
            });
            const issue = JSON.parse(issueData);
            return issue.body;
        }
        catch (error) {
            throw new Error(`Failed to fetch issue #${issueNumber}: ${error.message}`);
        }
    }
    async updateIssueBody(issueNumber, newBody) {
        const tempFile = `/tmp/issue-${issueNumber}-body.md`;
        try {
            (0, fs_1.writeFileSync)(tempFile, newBody);
            (0, child_process_1.execSync)(`gh issue edit ${issueNumber} --body-file ${tempFile}`);
            (0, fs_1.unlinkSync)(tempFile);
        }
        catch (error) {
            // Clean up temp file on error
            try {
                (0, fs_1.unlinkSync)(tempFile);
            }
            catch { }
            throw new Error(`Failed to update issue #${issueNumber}: ${error.message}`);
        }
    }
}
exports.GitHubCLIClient = GitHubCLIClient;
/**
 * Mock GitHub client for testing
 */
class MockGitHubClient {
    constructor(initialIssues = {}) {
        this.issues = new Map();
        for (const [number, body] of Object.entries(initialIssues)) {
            this.issues.set(parseInt(number), body);
        }
    }
    async getIssueBody(issueNumber) {
        const body = this.issues.get(issueNumber);
        if (!body) {
            throw new Error(`Issue #${issueNumber} not found`);
        }
        return body;
    }
    async updateIssueBody(issueNumber, newBody) {
        if (!this.issues.has(issueNumber)) {
            throw new Error(`Issue #${issueNumber} not found`);
        }
        this.issues.set(issueNumber, newBody);
    }
    // Test helpers
    getIssueBodySync(issueNumber) {
        return this.issues.get(issueNumber);
    }
    setIssueBody(issueNumber, body) {
        this.issues.set(issueNumber, body);
    }
}
exports.MockGitHubClient = MockGitHubClient;
//# sourceMappingURL=github-client.js.map