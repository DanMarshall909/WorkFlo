/**
 * Updates a GitHub issue's acceptance criteria by description
 * @param issueNumber - The GitHub issue number
 * @param acDescription - Description of the AC to mark complete
 * @returns Promise that resolves with result
 */
export declare function updateIssue(issueNumber: number, acDescription: string): Promise<{
    success: boolean;
    message: string;
}>;
//# sourceMappingURL=issue-updater.d.ts.map