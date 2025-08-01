"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParseResult = createParseResult;
exports.generateTests = generateTests;
exports.generateTestContent = generateTestContent;
function createParseResult(criteria, issueNumber, issueTitle) {
    const parsedCriteria = criteria.map((criterion, index) => {
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
    const result = {
        criteria: parsedCriteria,
        total: criteria.length,
        completed: 0,
        summary: {
            total: criteria.length,
            completed: 0,
            uncompleted: criteria.length
        }
    };
    if (issueNumber !== undefined)
        result.issueNumber = issueNumber;
    if (issueTitle !== undefined)
        result.issueTitle = issueTitle;
    return result;
}
function generateTests(criteriaOrParseResult, issueNumberOrOptions, issueTitle) {
    // Handle new interface (string array)
    if (Array.isArray(criteriaOrParseResult)) {
        const criteria = criteriaOrParseResult;
        const issueNumber = issueNumberOrOptions;
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
    const parseResult = criteriaOrParseResult;
    if (parseResult.criteria.length === 0) {
        throw new Error('No acceptance criteria found to generate tests for');
    }
    // Try to extract issue info from ParseResult properties or first criterion
    let issueId;
    let title;
    if (parseResult.issueNumber) {
        issueId = parseResult.issueNumber.toString();
        title = parseResult.issueTitle || 'User registration feature';
    }
    else {
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
function generateTestContent(testContent, options) {
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
//# sourceMappingURL=test-generator.js.map