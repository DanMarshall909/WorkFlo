import { markCriterionComplete, markCriterionCompleteByText, markCriterionCompleteById, markComplete } from '../src/issue-updater';

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

    it('should handle empty issue body for index-based marking', () => {
      // When/Then
      expect(() => markCriterionComplete('', 1))
        .toThrow('Issue body is required');
    });

    it('should handle null/undefined input for index-based marking', () => {
      // When/Then
      expect(() => markCriterionComplete(null as any, 1))
        .toThrow('Issue body is required');
      expect(() => markCriterionComplete(undefined as any, 1))
        .toThrow('Issue body is required');
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

    describe('markCriterionCompleteById', () => {
      it('should mark criterion by AC ID', () => {
        // Given
        const issueBody = `
- [ ] AC-1: First criterion
- [ ] AC-2: Second criterion
- [ ] AC-3: Third criterion
`;

        // When
        const result = markCriterionCompleteById(issueBody, 'AC-2');

        // Then
        expect(result).toContain('- [ ] AC-1: First criterion');
        expect(result).toContain('- [x] AC-2: Second criterion');
        expect(result).toContain('- [ ] AC-3: Third criterion');
      });

      it('should handle non-existent AC ID', () => {
        // Given
        const issueBody = '- [ ] AC-1: Only criterion';

        // When/Then
        expect(() => markCriterionCompleteById(issueBody, 'AC-5'))
          .toThrow('AC ID AC-5 not found');
      });

      it('should handle empty issue body', () => {
        // When/Then
        expect(() => markCriterionCompleteById('', 'AC-1'))
          .toThrow('Issue body is required');
      });

      it('should handle empty AC ID', () => {
        // When/Then
        expect(() => markCriterionCompleteById('- [ ] AC-1: Test', ''))
          .toThrow('AC ID is required');
      });

      it('should handle null/undefined inputs', () => {
        // When/Then
        expect(() => markCriterionCompleteById(null as any, 'AC-1'))
          .toThrow('Issue body is required');
        expect(() => markCriterionCompleteById('- [ ] AC-1: Test', null as any))
          .toThrow('AC ID is required');
      });

      it('should only match exact AC ID patterns', () => {
        // Given
        const issueBody = `
- [ ] AC-1: First criterion
- [ ] This mentions AC-1 but is different
- [ ] AC-10: Tenth criterion
`;

        // When
        const result = markCriterionCompleteById(issueBody, 'AC-1');

        // Then
        expect(result).toContain('- [x] AC-1: First criterion');
        expect(result).toContain('- [ ] This mentions AC-1 but is different');
        expect(result).toContain('- [ ] AC-10: Tenth criterion');
      });
    });

    describe('markComplete CLI interface', () => {
      it('should mark by AC ID when acId provided', () => {
        // Given
        const options = {
          body: '- [ ] AC-2: Test criterion',
          acId: 'AC-2'
        };

        // When
        const result = markComplete(options);

        // Then
        expect(result).toContain('- [x] AC-2: Test criterion');
      });

      it('should mark by index when index provided', () => {
        // Given
        const options = {
          body: '- [ ] First criterion\n- [ ] Second criterion',
          index: 2
        };

        // When
        const result = markComplete(options);

        // Then
        expect(result).toContain('- [ ] First criterion');
        expect(result).toContain('- [x] Second criterion');
      });

      it('should require issue body', () => {
        // When/Then
        expect(() => markComplete({ acId: 'AC-1' }))
          .toThrow('Issue body is required');
      });

      it('should require either index or acId', () => {
        // When/Then
        expect(() => markComplete({ body: '- [ ] Test' }))
          .toThrow('Either index or acId is required');
      });

      it('should prioritize acId over index when both provided', () => {
        // Given
        const options = {
          body: '- [ ] AC-1: First\n- [ ] AC-2: Second',
          acId: 'AC-2',
          index: 1
        };

        // When
        const result = markComplete(options);

        // Then - Should use acId (AC-2), not index (first item)
        expect(result).toContain('- [ ] AC-1: First');
        expect(result).toContain('- [x] AC-2: Second');
      });
    });
  });
});