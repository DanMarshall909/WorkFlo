import { markCriterionComplete, markCriterionCompleteByText } from '../src/issue-updater';

/**
 * @group issue-204
 * @group ac-5
 * @group cli
 */
describe('Issue #204: CLI command for updating acceptance criteria', () => {
  describe('AC-5: Create CLI command for parsing and updating', () => {
    it('should mark acceptance criterion as completed', () => {
      // Given
      const issueBody = `
## Acceptance Criteria
- [ ] First acceptance criterion
- [ ] Second acceptance criterion
- [ ] Third acceptance criterion
`;

      // When
      const updatedBody = markCriterionComplete(issueBody, 1);

      // Then
      expect(updatedBody).toContain('- [x] First acceptance criterion');
      expect(updatedBody).toContain('- [ ] Second acceptance criterion');
      expect(updatedBody).toContain('- [ ] Third acceptance criterion');
    });

    it('should handle already completed criteria', () => {
      // Given
      const issueBody = `
- [x] Already completed
- [ ] Not completed
`;

      // When - marking the first unchecked criterion (index 1)
      const updatedBody = markCriterionComplete(issueBody, 1);

      // Then - first unchecked becomes checked
      expect(updatedBody).toContain('- [x] Already completed');
      expect(updatedBody).toContain('- [x] Not completed');
    });

    it('should handle invalid criterion index', () => {
      // Given
      const issueBody = '- [ ] Only one criterion';

      // When/Then
      expect(() => markCriterionComplete(issueBody, 5)).toThrow('Criterion index 5 not found');
    });

    it('should mark criterion by description text', () => {
      // Given
      const issueBody = `
- [ ] Create function to parse acceptance criteria from issue body
- [ ] Handle various markdown checkbox formats
- [ ] Return structured data with AC index
`;

      // When
      const updatedBody = markCriterionCompleteByText(issueBody, 'parse acceptance criteria');

      // Then
      expect(updatedBody).toContain('- [x] Create function to parse acceptance criteria from issue body');
      expect(updatedBody).toContain('- [ ] Handle various markdown checkbox formats');
    });

    it.skip('should update GitHub issue via CLI command (integration test)', async () => {
      // Integration test - skipped in unit tests
      // This would require actual GitHub API access
      // Test manually: flo mark-ac 204 "some description"
      expect(true).toBe(true);
    });

    it.skip('should handle AC not found in issue (integration test)', async () => {
      // Integration test - skipped in unit tests
      // This would require actual GitHub API access
      expect(true).toBe(true);
    });
  });
});