export interface TestGenerationOptions {
    strategy: TestGenerationStrategy;
    outputPath: string;
    testFramework?: string;
    style?: string;
}
export type TestGeneratorOptions = TestGenerationOptions;
export type TestGenerationStrategy = 'new-file' | 'insert-before-end' | 'insert-at-marker' | 'insert-new-describe';
export interface ParsedCriterion {
    index: number;
    id?: string | undefined;
    text: string;
    cleanText: string;
    checked: boolean;
    raw: string;
}
export interface ParseResult {
    criteria: ParsedCriterion[];
    total: number;
    completed: number;
    issueNumber?: number;
    issueTitle?: string;
    summary?: {
        total: number;
        completed: number;
        uncompleted: number;
    };
}
export declare function createParseResult(criteria: string[], issueNumber?: number, issueTitle?: string): ParseResult;
/**
 * Generate tests based on criteria - overloaded function for backward compatibility
 */
export declare function generateTests(criteria: string[], issueNumber?: number, issueTitle?: string): string;
export declare function generateTests(parseResult: ParseResult, options?: TestGeneratorOptions): string;
/**
 * Generate test content with options
 */
export declare function generateTestContent(testContent: string, options: TestGenerationOptions): string;
//# sourceMappingURL=test-generator.d.ts.map