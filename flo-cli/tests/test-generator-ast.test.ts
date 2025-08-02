/**
 * @group issue-204
 * @group test-generator-ast
 * @group unit
 */

import { generateTests, generateTestContent, ParseResult, TestGenerationOptions } from '../src/test-generator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Issue #204: AST-based test insertion', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(() => {
    // Create temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-generator-'));
    testFile = path.join(tempDir, 'test.test.ts');
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const sampleParseResult: ParseResult = {
    criteria: [
      {
        index: 1,
        id: 'AC-1',
        text: 'AC-1: Create user login',
        cleanText: 'Create user login',
        checked: false,
        raw: '- [ ] AC-1: Create user login'
      },
      {
        index: 2,
        text: 'Validate password',
        cleanText: 'Validate password',
        checked: false,
        raw: '- [ ] Validate password'
      }
    ],
    total: 2,
    completed: 0,
    issueNumber: 123,
    issueTitle: 'Authentication feature'
  };

  describe('new-file strategy', () => {
    it('should create new test file', () => {
      // Given
      const options: TestGenerationOptions = {
        strategy: 'new-file',
        outputPath: testFile
      };

      // When
      const testContent = generateTests(sampleParseResult, options);
      const result = generateTestContent(testContent, options);

      // Then
      expect(result).toBe(testFile);
      expect(fs.existsSync(testFile)).toBe(true);
      
      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toContain('@group issue-123');
      expect(content).toContain('AC-1: Create user login');
      expect(content).toContain('AC-2: Validate password');
    });

    it('should create directory if it does not exist', () => {
      // Given
      const nestedFile = path.join(tempDir, 'nested', 'deep', 'test.test.ts');
      const options: TestGenerationOptions = {
        strategy: 'new-file',
        outputPath: nestedFile
      };

      // When
      const testContent = generateTests(sampleParseResult, options);
      const result = generateTestContent(testContent, options);

      // Then
      expect(result).toBe(nestedFile);
      expect(fs.existsSync(nestedFile)).toBe(true);
    });
  });

  describe('insert-before-end strategy', () => {
    it('should insert tests before end of existing describe block', () => {
      // Given
      const existingContent = `/**
 * Existing test file
 */
describe('Existing tests', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});`;
      fs.writeFileSync(testFile, existingContent);

      const options: TestGenerationOptions = {
        strategy: 'insert-before-end',
        outputPath: testFile
      };

      // When
      const testContent = generateTests(sampleParseResult, options);
      const result = generateTestContent(testContent, options);

      // Then
      expect(result).toBe(testFile);
      
      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toContain('should work');
      expect(content).toContain('AC-1: Create user login');
      expect(content).toContain('AC-2: Validate password');
      expect(content).toContain('@group ac-1');
    });

    it('should create file if missing and createFileIfMissing is true', () => {
      // Given
      const options: TestGenerationOptions = {
        strategy: 'insert-before-end',
        outputPath: testFile,
      };

      // When
      const testContent = generateTests(sampleParseResult, options);
      const result = generateTestContent(testContent, options);

      // Then
      expect(result).toBe(testFile);
      expect(fs.existsSync(testFile)).toBe(true);
    });

    it('should throw error if file missing and createFileIfMissing is false', () => {
      // Given
      const options: TestGenerationOptions = {
        strategy: 'insert-before-end',
        outputPath: testFile,
      };

      // When/Then
      expect(() => generateTests(sampleParseResult, options))
        .toThrow('does not exist');
    });
  });

  describe('insert-at-marker strategy', () => {
    it('should insert tests at marker comment', () => {
      // Given
      const existingContent = `describe('Tests', () => {
  it('existing test', () => {
    expect(true).toBe(true);
  });
  
  // INSERT_NEW_TESTS
});`;
      fs.writeFileSync(testFile, existingContent);

      const options: TestGenerationOptions = {
        strategy: 'insert-at-marker',
        outputPath: testFile,
      };

      // When
      const testContent = generateTests(sampleParseResult, options);
      const result = generateTestContent(testContent, options);

      // Then
      expect(result).toBe(testFile);
      
      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toContain('existing test');
      expect(content).toContain('AC-1: Create user login');
      expect(content).toContain('INSERT_NEW_TESTS');
    });

    it('should throw error if marker not found', () => {
      // Given
      const existingContent = `describe('Tests', () => {
  it('test', () => {
    expect(true).toBe(true);
  });
});`;
      fs.writeFileSync(testFile, existingContent);

      const options: TestGenerationOptions = {
        strategy: 'insert-at-marker',
        outputPath: testFile,
      };

      // When/Then
      expect(() => generateTests(sampleParseResult, options))
        .toThrow('Marker "MISSING_MARKER" not found');
    });
  });

  describe('insert-new-describe strategy', () => {
    it('should add new describe block to existing file', () => {
      // Given
      const existingContent = `describe('Existing tests', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});`;
      fs.writeFileSync(testFile, existingContent);

      const options: TestGenerationOptions = {
        strategy: 'insert-new-describe',
        outputPath: testFile
      };

      // When
      const testContent = generateTests(sampleParseResult, options);
      const result = generateTestContent(testContent, options);

      // Then
      expect(result).toBe(testFile);
      
      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toContain('Existing tests');
      expect(content).toContain('#123: Authentication feature');
    });
  });

  describe('error handling', () => {
    it('should throw error for unknown strategy', () => {
      // Given
      const options: TestGenerationOptions = {
        strategy: 'unknown-strategy' as any,
        outputPath: testFile
      };

      // When/Then
      expect(() => generateTests(sampleParseResult, options))
        .toThrow('Unknown insertion strategy');
    });

    it('should throw error if outputPath missing for strategies that require it', () => {
      // Given
      const options: TestGenerationOptions = {
        strategy: 'insert-before-end',
        outputPath: '/nonexistent/path/file.ts'
      };

      // When/Then
      expect(() => generateTests(sampleParseResult, options))
        .toThrow('Target file required');
    });

    it('should throw error if marker missing for insert-at-marker strategy', () => {
      // Given
      const options: TestGenerationOptions = {
        strategy: 'insert-at-marker',
        outputPath: testFile
      };

      // When/Then
      expect(() => generateTests(sampleParseResult, options))
        .toThrow('Target file and marker required');
    });
  });
});