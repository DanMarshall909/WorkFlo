/**
 * TypeScript/Jest test generator that consumes acceptance criteria parser output
 * Supports both new file generation and AST-based insertion into existing files
 */
export interface AcceptanceCriterion {
    index: number;
    id?: string;
    text: string;
    cleanText: string;
    checked: boolean;
    raw: string;
}
export interface ParseResult {
    criteria: AcceptanceCriterion[];
    total: number;
    completed: number;
    issueNumber?: number;
    issueTitle?: string;
}
export interface TestGeneratorOptions {
    outputPath?: string;
    testFramework?: 'jest';
    style?: 'bdd' | 'tdd';
}
export interface TestInsertionOptions {
    strategy: 'new-file' | 'insert-before-end' | 'insert-at-marker' | 'insert-new-describe';
    targetFile?: string;
    marker?: string;
    createFileIfMissing?: boolean;
}
/**
 * Generates TypeScript/Jest test files from acceptance criteria parser output
 */
export declare function generateTests(parseResult: ParseResult, _options?: TestGeneratorOptions): string;
/**
 * Convert simple acceptance criteria array to structured ParseResult format
 */
export declare function createParseResult(criteria: string[], issueNumber?: number, issueTitle?: string): ParseResult;
/**
 * Generate and insert tests using AST-based manipulation
 */
export declare function generateAndInsertTests(parseResult: ParseResult, insertionOptions: TestInsertionOptions, generatorOptions?: TestGeneratorOptions): string;
//# sourceMappingURL=test-generator.d.ts.map