import { GitHubClient } from './github-client';
/**
 * Marks a specific acceptance criterion as completed by index
 * @param issueBody - The GitHub issue body
 * @param index - 1-based index of the criterion to mark complete
 * @returns Updated issue body with the criterion marked as completed
 */
export declare function markCriterionComplete(issueBody: string, index: number): string;
/**
 * Marks a specific acceptance criterion as completed by AC ID
 * @param issueBody - The GitHub issue body
 * @param acId - The AC ID (e.g., "AC-1", "AC-2")
 * @returns Updated issue body with the criterion marked as completed
 */
export declare function markCriterionCompleteById(issueBody: string, acId: string): string;
/**
 * Set GitHub client (for testing)
 */
export declare function setGitHubClient(client: GitHubClient): void;
/**
 * Updates a GitHub issue's acceptance criteria by description
 * @param issueNumber - The GitHub issue number
 * @param acDescription - Description of the AC to mark complete
 * @returns Promise that resolves with result
 */
export declare function updateIssueAC(issueNumber: number, acDescription: string): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Marks a criterion as complete by matching the description text
 */
export declare function markCriterionCompleteByText(issueBody: string, description: string): string;
/**
 * CLI interface for marking acceptance criteria as complete
 */
export interface MarkCompleteOptions {
    issue?: number;
    index?: number;
    acId?: string;
    body?: string;
}
export declare function markComplete(options: MarkCompleteOptions): string;
//# sourceMappingURL=issue-updater.d.ts.map