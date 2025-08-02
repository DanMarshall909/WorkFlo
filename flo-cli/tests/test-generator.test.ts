/**
 * @group issue-204
 * @group test-generator
 * @group unit
 */

import { generateTests, createParseResult, ParseResult, TestGeneratorOptions } from '../src/test-generator';

describe('Issue #204: TypeScript/Jest test generator', () => {
  describe('generateTests', () => {
    it('should generate Jest test file with proper structure', () => {
      // Given
      const parseResult: ParseResult = {
        criteria: [
          {
            index: 1,
            id: 'AC-1',
            text: 'AC-1: Create user registration',
            cleanText: 'Create user registration',
            checked: false,
            raw: '- [ ] AC-1: Create user registration'
          },
          {
            index: 2,
            id: 'AC-2',
            text: 'AC-2: Validate email format',
            cleanText: 'Validate email format',
            checked: false,
            raw: '- [ ] AC-2: Validate email format'
          }
        ],
        total: 2,
        completed: 0,
        issueNumber: 123,
        issueTitle: 'User registration feature'
      };

      // When
      const result = generateTests(parseResult);

      // Then
      expect(result).toContain('/**');
      expect(result).toContain('@group issue-123');
      expect(result).toContain('@group generator');
      expect(result).toContain('@group unit');
      expect(result).toContain("describe('#123: User registration feature', () => {");
      expect(result).toContain('@group ac-1');
      expect(result).toContain('AC-1: Create user registration');
      expect(result).toContain('@group ac-2');
      expect(result).toContain('AC-2: Validate email format');
      expect(result).toContain("throw new Error('Not implemented');");
    });

    it('should handle empty criteria array', () => {
      // Given
      const parseResult: ParseResult = {
        criteria: [],
        total: 0,
        completed: 0
      };

      // When/Then
      expect(() => generateTests(parseResult)).toThrow('No acceptance criteria found to generate tests for');
    });

    it('should use default values when issue info is missing', () => {
      // Given
      const parseResult: ParseResult = {
        criteria: [
          {
            index: 1,
            text: 'Test criterion',
            cleanText: 'Test criterion',
            checked: false,
            raw: '- [ ] Test criterion'
          }
        ],
        total: 1,
        completed: 0
      };

      // When
      const result = generateTests(parseResult);

      // Then
      expect(result).toContain('@group issue-unknown-issue');
      expect(result).toContain("describe('#unknown-issue: Unknown Issue: Acceptance criteria tests', () => {");
    });

    it('should respect test generator options', () => {
      // Given
      const parseResult: ParseResult = {
        criteria: [
          {
            index: 1,
            text: 'Test criterion',
            cleanText: 'Test criterion',
            checked: false,
            raw: '- [ ] Test criterion'
          }
        ],
        total: 1,
        completed: 0,
        issueNumber: 456
      };
      const options: TestGeneratorOptions = {
        strategy: 'new-file',
        outputPath: 'test.ts',
        testFramework: 'jest',
        style: 'bdd'
      };

      // When
      const result = generateTests(parseResult, options);

      // Then
      expect(result).toContain('@group issue-456');
      expect(result).toBeTruthy();
    });
  });

  describe('createParseResult', () => {
    it('should convert simple criteria array to structured format', () => {
      // Given
      const criteria = ['AC-1: Create user login', 'Validate password strength'];
      const issueNumber = 789;
      const issueTitle = 'Authentication feature';

      // When
      const result = createParseResult(criteria, issueNumber, issueTitle);

      // Then
      expect(result.criteria).toHaveLength(2);
      expect(result.criteria[0]).toEqual({
        index: 1,
        id: 'AC-1',
        text: 'AC-1: Create user login',
        cleanText: 'Create user login',
        checked: false,
        raw: '- [ ] AC-1: Create user login'
      });
      expect(result.criteria[1]).toEqual({
        index: 2,
        id: undefined,
        text: 'Validate password strength',
        cleanText: 'Validate password strength',
        checked: false,
        raw: '- [ ] Validate password strength'
      });
      expect(result.total).toBe(2);
      expect(result.completed).toBe(0);
      expect(result.issueNumber).toBe(789);
      expect(result.issueTitle).toBe('Authentication feature');
    });

    it('should handle criteria without AC-N prefix', () => {
      // Given
      const criteria = ['Simple criterion', 'Another criterion'];

      // When
      const result = createParseResult(criteria);

      // Then
      expect(result.criteria).toHaveLength(2);
      expect(result.criteria[0]?.id).toBeUndefined();
      expect(result.criteria[0]?.text).toBe('Simple criterion');
      expect(result.criteria[0]?.cleanText).toBe('Simple criterion');
      expect(result.criteria[1]?.id).toBeUndefined();
    });

    it('should handle empty criteria array', () => {
      // Given
      const criteria: string[] = [];

      // When
      const result = createParseResult(criteria);

      // Then
      expect(result.criteria).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
    });
  });
});