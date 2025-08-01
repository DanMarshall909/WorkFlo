export interface TestGenerationOptions {
  strategy: TestGenerationStrategy;
  outputPath: string;
  testFramework?: string;
  style?: string;
}

// Legacy alias for backward compatibility
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

export function createParseResult(criteria: string[], issueNumber?: number, issueTitle?: string): ParseResult {
  const parsedCriteria: ParsedCriterion[] = criteria.map((criterion, index) => {
    // Extract ID if it exists (AC-N: pattern)
    const idMatch = criterion.match(/^(AC-\d+):\s*/);
    const id = idMatch ? idMatch[1] : undefined;
    const cleanText = criterion.replace(/^(AC-\d+):\s*/, '').trim();
    
    return {
      index: index + 1,
      id,
      text: criterion,
      cleanText,
      checked: false,
      raw: `- [ ] ${criterion}`
    };
  });

  const result: ParseResult = {
    criteria: parsedCriteria,
    total: criteria.length,
    completed: 0,
    summary: {
      total: criteria.length,
      completed: 0,
      uncompleted: criteria.length
    }
  };
  
  if (issueNumber !== undefined) result.issueNumber = issueNumber;
  if (issueTitle !== undefined) result.issueTitle = issueTitle;
  
  return result;
}

/**
 * Generate tests based on criteria - overloaded function for backward compatibility
 */
export function generateTests(criteria: string[], issueNumber?: number, issueTitle?: string): string;
export function generateTests(parseResult: ParseResult, options?: TestGeneratorOptions): string;
export function generateTests(
  criteriaOrParseResult: string[] | ParseResult, 
  issueNumberOrOptions?: number | TestGeneratorOptions, 
  issueTitle?: string
): string {
  // Handle new interface (string array)
  if (Array.isArray(criteriaOrParseResult)) {
    const criteria = criteriaOrParseResult;
    const issueNumber = issueNumberOrOptions as number;
    
    if (criteria.length === 0) {
      throw new Error('No acceptance criteria found to generate tests for');
    }
    
    const issueId = issueNumber || 'unknown-issue';
    const title = issueTitle || 'Acceptance criteria tests';
    
    return `/**
 * @group issue-${issueId}
 * @group generator
 * @group unit
 */

describe('#${issueId}: ${title}', () => {
${criteria.map((criterion, index) => `  /**
   * @group ac-${index + 1}
   */
  describe('AC-${index + 1}: ${criterion}', () => {
    it('should ${criterion.toLowerCase()}', () => {
      // Given
      
      // When
      
      // Then
      throw new Error('Not implemented');
    });
  });`).join('\n\n')}
});`;
  }
  
  // Handle legacy interface (ParseResult)
  const parseResult = criteriaOrParseResult as ParseResult;
  
  if (parseResult.criteria.length === 0) {
    throw new Error('No acceptance criteria found to generate tests for');
  }
  
  // Try to extract issue info from ParseResult properties or first criterion
  let issueId: string;
  let title: string;
  
  if (parseResult.issueNumber) {
    issueId = parseResult.issueNumber.toString();
    title = parseResult.issueTitle || 'User registration feature';
  } else {
    // Try to extract from first criterion text
    const firstCriterion = parseResult.criteria[0];
    const issueMatch = firstCriterion?.text.match(/#(\d+)/);
    issueId = issueMatch?.[1] || 'unknown-issue';
    title = issueId === 'unknown-issue' ? 'Unknown Issue: Acceptance criteria tests' : 'User registration feature';
  }
  
  return `/**
 * @group issue-${issueId}
 * @group generator
 * @group unit
 */

describe('#${issueId}: ${title}', () => {
${parseResult.criteria.map((criterion) => `  /**
   * @group ac-${criterion.index}
   */
  describe('${criterion.text}', () => {
    it('should ${criterion.cleanText.toLowerCase()}', () => {
      // Given
      
      // When
      
      // Then
      throw new Error('Not implemented');
    });
  });`).join('\n\n')}
});`;
}

/**
 * Generate test content with options
 */
export function generateTestContent(testContent: string, options: TestGenerationOptions): string {
  const fs = require('fs');
  const path = require('path');
  
  // Ensure directory exists
  const dir = path.dirname(options.outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write the test content to file
  fs.writeFileSync(options.outputPath, testContent, 'utf8');
  
  return options.outputPath;
}