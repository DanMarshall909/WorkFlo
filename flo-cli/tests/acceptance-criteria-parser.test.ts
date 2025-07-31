import { parseAcceptanceCriteria } from '../src/acceptance-criteria-parser';

/**
 * @group issue-204
 * @group parser
 * @group unit
 */
describe('Issue #204: Auto-generate issues from acceptance criteria', () => {
  /**
   * @group ac-1
   */
  describe('AC-1: Parse acceptance criteria from issue body', () => {
    it('extracts checkbox list items as acceptance criteria', () => {
      // Given
      const issueBody = `
## Description
This issue is about parsing acceptance criteria.

## Acceptance Criteria
- [ ] First acceptance criteria
- [ ] Second acceptance criteria  
- [ ] Third acceptance criteria

## Additional Notes
Some other content here.
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'First acceptance criteria',
        'Second acceptance criteria',
        'Third acceptance criteria'
      ]);
    });

    it('handles empty issue body', () => {
      // Given
      const issueBody = '';

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([]);
    });

    it('handles issue body with no acceptance criteria', () => {
      // Given
      const issueBody = `
## Description
This issue has no acceptance criteria.

## Other Section
Just some content without checkboxes.
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([]);
    });

    it('ignores checked checkboxes', () => {
      // Given
      const issueBody = `
- [ ] Unchecked criteria 1
- [x] Already completed criteria
- [ ] Unchecked criteria 2
- [X] Another completed criteria
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'Unchecked criteria 1',
        'Unchecked criteria 2'
      ]);
    });

    it('handles various markdown formatting', () => {
      // Given
      const issueBody = `
- [ ] Criteria with **bold** text
- [ ] Criteria with _italic_ text
- [ ] Criteria with \`code\` blocks
- [ ] Criteria with [links](https://example.com)
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'Criteria with **bold** text',
        'Criteria with _italic_ text',
        'Criteria with `code` blocks',
        'Criteria with [links](https://example.com)'
      ]);
    });

    // COVER phase - comprehensive tests
    it('handles different checkbox formats', () => {
      // Given
      const issueBody = `
- [ ] Standard dash format
* [ ] Asterisk format
+ [ ] Plus format
- [] No space format (invalid)
-[] Missing space (invalid)
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'Standard dash format'
        // Note: Our current implementation only handles "- [ ]" format
      ]);
    });

    it('handles nested lists and indentation', () => {
      // Given
      const issueBody = `
- [ ] Top level criterion
  - [ ] Nested criterion (should be ignored)
    - [ ] Deep nested (should be ignored)
- [ ] Another top level
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'Top level criterion',
        'Another top level'
      ]);
    });

    it('handles mixed content with acceptance criteria section', () => {
      // Given
      const issueBody = `
## Description
This is a feature description.

## Acceptance Criteria
- [ ] First AC in section
- [ ] Second AC in section

## Other Section
- [ ] This should also be captured
Some other text
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'First AC in section',
        'Second AC in section',
        'This should also be captured'
      ]);
    });

    it('handles malformed checkboxes', () => {
      // Given
      const issueBody = `
- [ ] Valid checkbox
- [  ] Extra space inside
- [ x] Space before x
- [X ] Space after X
- [] Missing spaces
- [ ] Valid checkbox 2
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'Valid checkbox',
        'Valid checkbox 2'
      ]);
    });

    it('handles extremely long criteria text', () => {
      // Given
      const longText = 'A'.repeat(500);
      const issueBody = `- [ ] ${longText}`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([longText]);
      expect(criteria[0].length).toBe(500);
    });

    it('handles special characters and unicode', () => {
      // Given
      const issueBody = `
- [ ] Criterion with émojis 🚀 and symbols @#$%
- [ ] Japanese text: こんにちは
- [ ] Mixed: Test™ with © symbols
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'Criterion with émojis 🚀 and symbols @#$%',
        'Japanese text: こんにちは',
        'Mixed: Test™ with © symbols'
      ]);
    });

    it('handles Windows-style line endings', () => {
      // Given
      const issueBody = '- [ ] First criterion\r\n- [ ] Second criterion\r\n';

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'First criterion',
        'Second criterion'
      ]);
    });

    it('handles criteria with trailing whitespace', () => {
      // Given
      const issueBody = `
- [ ] Criterion with trailing spaces    
- [ ] Criterion with tabs		
- [ ] Normal criterion
`;

      // When
      const criteria = parseAcceptanceCriteria(issueBody);

      // Then
      expect(criteria).toEqual([
        'Criterion with trailing spaces',
        'Criterion with tabs',
        'Normal criterion'
      ]);
    });

    it('handles null and undefined input gracefully', () => {
      // When/Then
      expect(parseAcceptanceCriteria(null as any)).toEqual([]);
      expect(parseAcceptanceCriteria(undefined as any)).toEqual([]);
    });

    it('performance test - handles large issue bodies efficiently', () => {
      // Given - 1000 criteria
      const criteria = Array.from({ length: 1000 }, (_, i) => `- [ ] Criterion ${i + 1}`);
      const issueBody = criteria.join('\n');

      // When
      const startTime = Date.now();
      const result = parseAcceptanceCriteria(issueBody);
      const endTime = Date.now();

      // Then
      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should parse in < 100ms
    });
  });
});