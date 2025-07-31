/**
 * TypeScript/Jest test generator that consumes acceptance criteria parser output
 * Supports both new file generation and AST-based insertion into existing files
 */

import { Project, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

export interface AcceptanceCriterion {
  index: number;          // 1-based index
  id?: string;           // Optional "AC-1" prefix
  text: string;          // Full text including any prefix
  cleanText: string;     // Text without AC-N: prefix
  checked: boolean;      // Checkbox state
  raw: string;           // Original markdown line
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
  testFramework?: 'jest';  // Future: 'mocha' | 'vitest'
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
export function generateTests(
  parseResult: ParseResult,
  _options: TestGeneratorOptions = {}
): string {
  // Future: use testFramework and style options when supporting multiple frameworks
  const { criteria, issueNumber, issueTitle } = parseResult;
  
  if (criteria.length === 0) {
    throw new Error('No acceptance criteria found to generate tests for');
  }

  const issueRef = issueNumber ? `#${issueNumber}` : 'Unknown Issue';
  const title = issueTitle || 'Acceptance criteria tests';
  
  return generateTestContent(issueRef, title, criteria);
}

/**
 * Generates test content with proper Jest structure and @group annotations
 */
function generateTestContent(issueRef: string, title: string, criteria: AcceptanceCriterion[]): string {
  const issueGroup = issueRef.toLowerCase().replace('#', 'issue-').replace(/\s+/g, '-');
  
  let content = `/**
 * @group ${issueGroup}
 * @group generator
 * @group unit
 */
describe('${issueRef}: ${title}', () => {
`;

  criteria.forEach((criterion) => {
    const acGroup = criterion.id ? criterion.id.toLowerCase() : `ac-${criterion.index}`;
    const cleanText = criterion.cleanText || criterion.text;
    
    content += `  /**
   * @group ${acGroup}
   */
  describe('${criterion.id || `AC-${criterion.index}`}: ${cleanText}', () => {
    it('should ${cleanText.toLowerCase()}', () => {
      // Given
      
      // When
      
      // Then
      throw new Error('Not implemented');
    });
  });

`;
  });

  content += '});\n';
  return content;
}

/**
 * Convert simple acceptance criteria array to structured ParseResult format
 */
export function createParseResult(
  criteria: string[],
  issueNumber?: number,
  issueTitle?: string
): ParseResult {
  const structuredCriteria: AcceptanceCriterion[] = criteria.map((text, index) => {
    // Extract AC-N prefix if present
    const acMatch = text.match(/^(AC-\d+):\s*(.+)$/);
    
    return {
      index: index + 1,
      id: acMatch ? acMatch[1] : undefined,
      text: text,
      cleanText: acMatch ? acMatch[2] : text,
      checked: false,
      raw: `- [ ] ${text}`
    };
  });

  return {
    criteria: structuredCriteria,
    total: criteria.length,
    completed: 0,
    issueNumber,
    issueTitle
  };
}

/**
 * Generate and insert tests using AST-based manipulation
 */
export function generateAndInsertTests(
  parseResult: ParseResult,
  insertionOptions: TestInsertionOptions,
  generatorOptions: TestGeneratorOptions = {}
): string {
  const { strategy, targetFile, marker, createFileIfMissing = true } = insertionOptions;
  
  switch (strategy) {
    case 'new-file':
      return createNewTestFile(parseResult, { ...generatorOptions, outputPath: targetFile });
      
    case 'insert-before-end':
      if (!targetFile) throw new Error('Target file required for insert-before-end strategy');
      return insertBeforeEnd(parseResult, targetFile, generatorOptions, createFileIfMissing);
      
    case 'insert-at-marker':
      if (!targetFile || !marker) throw new Error('Target file and marker required for insert-at-marker strategy');
      return insertAtMarker(parseResult, targetFile, marker, generatorOptions, createFileIfMissing);
      
    case 'insert-new-describe':
      if (!targetFile) throw new Error('Target file required for insert-new-describe strategy');
      return insertNewDescribeBlock(parseResult, targetFile, generatorOptions, createFileIfMissing);
      
    default:
      throw new Error(`Unknown insertion strategy: ${strategy}`);
  }
}

/**
 * Create a new test file (existing functionality)
 */
function createNewTestFile(
  parseResult: ParseResult,
  options: TestGeneratorOptions
): string {
  const testCode = generateTests(parseResult, options);
  const fileName = options.outputPath || `tests/issue-${parseResult.issueNumber || 'unknown'}.test.ts`;
  
  // Ensure directory exists
  const dir = path.dirname(fileName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fileName, testCode);
  return fileName;
}

/**
 * Insert tests before the end of the last describe block using AST
 */
function insertBeforeEnd(
  parseResult: ParseResult,
  targetFile: string,
  options: TestGeneratorOptions,
  createFileIfMissing: boolean
): string {
  if (!fs.existsSync(targetFile)) {
    if (createFileIfMissing) {
      return createNewTestFile({ ...parseResult }, { ...options, outputPath: targetFile });
    }
    throw new Error(`Target file ${targetFile} does not exist`);
  }

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(targetFile);
  
  // Find the outermost describe block
  const describeBlocks = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => {
      const expression = call.getExpression();
      return expression.getKind() === SyntaxKind.Identifier && 
             expression.getText() === 'describe';
    });

  if (describeBlocks.length === 0) {
    throw new Error('No describe blocks found in target file');
  }

  // Get the outermost describe block (first one that's not nested)
  const outermostDescribe = describeBlocks.find(block => {
    return !describeBlocks.some(otherBlock => 
      otherBlock !== block && otherBlock.getStart() < block.getStart() && otherBlock.getEnd() > block.getEnd()
    );
  });

  if (!outermostDescribe) {
    throw new Error('Could not find outermost describe block');
  }

  // Generate individual test blocks for each criterion
  const testBlocks = parseResult.criteria.map(criterion => 
    generateSingleTestBlock(criterion)
  ).join('\n\n');

  // Find the block statement of the describe
  const blockStatement = outermostDescribe.getArguments()[1];
  if (blockStatement && blockStatement.getKind() === SyntaxKind.ArrowFunction) {
    const arrowFunc = blockStatement.asKindOrThrow(SyntaxKind.ArrowFunction);
    const body = arrowFunc.getBody();
    
    if (body && body.getKind() === SyntaxKind.Block) {
      const block = body.asKindOrThrow(SyntaxKind.Block);
      
      // Insert before the end of the block
      sourceFile.insertText(block.getEnd() - 1, `\n${testBlocks}\n`);
    }
  }

  sourceFile.saveSync();
  return targetFile;
}

/**
 * Insert tests at a specific marker comment
 */
function insertAtMarker(
  parseResult: ParseResult,
  targetFile: string,
  marker: string,
  _options: TestGeneratorOptions,
  createFileIfMissing: boolean
): string {
  if (!fs.existsSync(targetFile)) {
    if (createFileIfMissing) {
      const templateContent = `/**
 * Generated test file
 */
describe('Tests', () => {
  // ${marker}
});`;
      fs.writeFileSync(targetFile, templateContent);
    } else {
      throw new Error(`Target file ${targetFile} does not exist`);
    }
  }

  // Read the file content and use string replacement as fallback
  const content = fs.readFileSync(targetFile, 'utf8');
  
  if (!content.includes(marker)) {
    throw new Error(`Marker "${marker}" not found in target file`);
  }

  // Generate test blocks
  const testBlocks = parseResult.criteria.map(criterion => 
    generateSingleTestBlock(criterion)
  ).join('\n\n');

  // Replace the marker with tests + marker
  const updatedContent = content.replace(
    `// ${marker}`,
    `${testBlocks}\n\n  // ${marker}`
  );

  fs.writeFileSync(targetFile, updatedContent);
  return targetFile;
}

/**
 * Insert a new top-level describe block for the issue
 */
function insertNewDescribeBlock(
  parseResult: ParseResult,
  targetFile: string,
  options: TestGeneratorOptions,
  createFileIfMissing: boolean
): string {
  if (!fs.existsSync(targetFile)) {
    if (createFileIfMissing) {
      return createNewTestFile({ ...parseResult }, { ...options, outputPath: targetFile });
    }
    throw new Error(`Target file ${targetFile} does not exist`);
  }

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(targetFile);
  
  // Generate the complete describe block for this issue
  const testContent = generateTests(parseResult, options);
  
  // Add at the end of the file
  sourceFile.addStatements(testContent);
  
  sourceFile.saveSync();
  return targetFile;
}

/**
 * Generate a single test block for one acceptance criterion
 */
function generateSingleTestBlock(criterion: AcceptanceCriterion): string {
  const acGroup = criterion.id ? criterion.id.toLowerCase() : `ac-${criterion.index}`;
  const cleanText = criterion.cleanText || criterion.text;
  
  return `  /**
   * @group ${acGroup}
   */
  describe('${criterion.id || `AC-${criterion.index}`}: ${cleanText}', () => {
    it('should ${cleanText.toLowerCase()}', () => {
      // Given
      
      // When
      
      // Then
      throw new Error('Not implemented');
    });
  });`;
}