export interface TestGenerationOptions {
  strategy: TestGenerationStrategy;
  outputPath: string;
  testFramework?: string;
  style?: string;
  marker?: string;
  createFileIfMissing?: boolean;
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
  
  // Handle ParseResult interface with options
  const parseResult = criteriaOrParseResult as ParseResult;
  const options = issueNumberOrOptions as TestGeneratorOptions;
  
  if (parseResult.criteria.length === 0) {
    throw new Error('No acceptance criteria found to generate tests for');
  }
  
  // Validate options based on strategy
  if (options) {
    if (!options.strategy) {
      options.strategy = 'new-file';
    }
    
    if (options.strategy !== 'new-file' && !options.outputPath) {
      throw new Error('Target file required for insertion strategies');
    }
    
    if (options.strategy === 'insert-at-marker' && !options.marker) {
      throw new Error('Target file and marker required for insert-at-marker strategy');
    }
    
    if (!['new-file', 'insert-before-end', 'insert-at-marker', 'insert-new-describe'].includes(options.strategy)) {
      throw new Error('Unknown insertion strategy: ' + options.strategy);
    }
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
  
  const newTestContent = `/**
 * @group issue-${issueId}
 * @group generator
 * @group unit
 */

describe('#${issueId}: ${title}', () => {
${parseResult.criteria.map((criterion) => `  /**
   * @group ac-${criterion.index}
   */
  describe('${criterion.id ? criterion.text : `AC-${criterion.index}: ${criterion.cleanText}`}', () => {
    it('should ${criterion.cleanText.toLowerCase()}', () => {
      // Given
      
      // When
      
      // Then
      throw new Error('Not implemented');
    });
  });`).join('\n\n')}
});`;

  // Handle different strategies if options provided
  if (options && options.strategy !== 'new-file') {
    const fs = require('fs');
    
    if (!fs.existsSync(options.outputPath)) {
      if (options.createFileIfMissing === false) {
        throw new Error(`Target file ${options.outputPath} does not exist`);
      }
      // Create file with new content
      return newTestContent;
    }
    
    const existingContent = fs.readFileSync(options.outputPath, 'utf8');
    
    switch (options.strategy) {
      case 'insert-before-end':
        // Insert before the last closing brace of the outer describe
        return existingContent.replace(/(\}\);?\s*)$/, '\n\n' + newTestContent + '\n$1');
        
      case 'insert-at-marker':
        if (!options.marker) {
          throw new Error('Marker required for insert-at-marker strategy');
        }
        const marker = `// ${options.marker}`;
        if (!existingContent.includes(marker)) {
          throw new Error(`Marker "${options.marker}" not found in ${options.outputPath}`);
        }
        return existingContent.replace(marker, newTestContent + '\n' + marker);
        
      case 'insert-new-describe':
        // Append new describe block to the end of the file
        return existingContent.trim() + '\n\n' + newTestContent;
        
      default:
        throw new Error('Unknown insertion strategy: ' + options.strategy);
    }
  }
  
  return newTestContent;
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
  
  // For strategies other than 'new-file', the content is already merged by generateTests
  // So we just write it directly
  fs.writeFileSync(options.outputPath, testContent, 'utf8');
  
  return options.outputPath;
}