export interface TestGenerationOptions {
    strategy: TestGenerationStrategy;
    outputPath: string;
}
export type TestGenerationStrategy = 'new-file' | 'insert-before-end' | 'insert-at-marker' | 'insert-new-describe';
/**
 * Generate tests based on criteria
 */
export declare function generateTests(criteria: string[], issueNumber: number, issueTitle: string): string;
/**
 * Generate test content with options
 */
export declare function generateTestContent(_testContent: string, options: TestGenerationOptions): string;
//# sourceMappingURL=test-generator.d.ts.map