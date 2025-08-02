/**
 * Common type definitions for the flo-cli project
 */
export interface GitHubIssue {
    body: string;
    title?: string;
    number?: number;
    state?: string;
    created_at?: string;
    updated_at?: string;
}
export interface GitHubApiResponse<T> {
    data?: T;
    error?: string;
    status?: number;
}
export interface AcceptanceCriteria {
    text: string;
    checked: boolean;
    index: number;
}
export interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}
//# sourceMappingURL=types.d.ts.map