import { parseAcceptanceCriteria } from '../src/acceptance-criteria-parser';

describe('Acceptance Criteria Parser', () => {
  describe('When parsing GitHub issue body with acceptance criteria', () => {
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
  });
});