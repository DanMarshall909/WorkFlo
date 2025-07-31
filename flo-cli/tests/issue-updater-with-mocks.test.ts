/**
 * @group issue-204
 * @group ac-5
 * @group integration
 */

import { updateIssueAC, setGitHubClient, markCriterionCompleteByText } from '../src/issue-updater';
import { MockGitHubClient } from '../src/github-client';

describe('Issue #204: GitHub Integration with Mocks', () => {
  describe('AC-5: Create CLI command with GitHub integration', () => {
    let mockClient: MockGitHubClient;

    beforeEach(() => {
      // Set up mock client with test data
      mockClient = new MockGitHubClient({
        204: `Create functionality to parse and validate acceptance criteria from GitHub issues.

## Acceptance Criteria

### Parser (AC 1-5)
- [x] Create function to parse acceptance criteria from issue body
- [ ] Handle various markdown checkbox formats (- [ ], * [ ], etc.)
- [ ] Return structured data with AC index, text, and checked status
- [ ] Extract AC-N prefix when present (e.g., "AC-1: Do something")
- [x] Create CLI command for parsing: \`flo-cli parse-ac\`

### TypeScript Test Generator (AC 6-9)
- [ ] Create TypeScript/Jest test generator consuming parser output
- [x] Generate describe blocks with issue number and AC text
- [x] Include @group annotations for jest-runner-groups
- [ ] Create CLI command for generation: \`flo-cli generate-tests\``,

        999: `This is a test issue with no acceptance criteria.

Just some regular content without checkboxes.`
      });

      setGitHubClient(mockClient);
    });

    it('should successfully mark acceptance criterion as complete', async () => {
      // Given
      const issueNumber = 204;
      const acDescription = 'Handle various markdown checkbox formats';

      // When
      const result = await updateIssueAC(issueNumber, acDescription);

      // Then
      expect(result.success).toBe(true);
      expect(result.message).toContain('marked as complete in issue #204');

      // Verify the issue was actually updated
      const updatedBody = mockClient.getIssueBodySync(204);
      expect(updatedBody).toContain('- [x] Handle various markdown checkbox formats');
      expect(updatedBody).toContain('- [ ] Return structured data with AC index'); // Other ACs unchanged
    });

    it('should handle partial text matches correctly', async () => {
      // Given
      const issueNumber = 204;
      const acDescription = 'structured data'; // Partial match

      // When  
      const result = await updateIssueAC(issueNumber, acDescription);

      // Then
      expect(result.success).toBe(true);
      
      const updatedBody = mockClient.getIssueBodySync(204);
      expect(updatedBody).toContain('- [x] Return structured data with AC index, text, and checked status');
    });

    it('should reject AC that is already completed', async () => {
      // Given
      const issueNumber = 204;
      const acDescription = 'Create function to parse acceptance criteria'; // Already marked [x]

      // When/Then
      await expect(updateIssueAC(issueNumber, acDescription))
        .rejects.toThrow('Acceptance criterion not found');
    });

    it('should handle non-existent acceptance criterion', async () => {
      // Given
      const issueNumber = 204;
      const acDescription = 'This AC does not exist';

      // When/Then
      await expect(updateIssueAC(issueNumber, acDescription))
        .rejects.toThrow('Failed to update issue: Acceptance criterion not found');
    });

    it('should handle non-existent issue', async () => {
      // Given
      const issueNumber = 404;
      const acDescription = 'Any description';

      // When/Then
      await expect(updateIssueAC(issueNumber, acDescription))
        .rejects.toThrow('Failed to update issue: Issue #404 not found');
    });

    it('should handle issue with no acceptance criteria', async () => {
      // Given
      const issueNumber = 999;
      const acDescription = 'Some description';

      // When/Then
      await expect(updateIssueAC(issueNumber, acDescription))
        .rejects.toThrow('Failed to update issue: Acceptance criterion not found');
    });

    it('should be case insensitive when matching descriptions', async () => {
      // Given
      const issueNumber = 204;
      const acDescription = 'EXTRACT AC-N PREFIX'; // Different case

      // When
      const result = await updateIssueAC(issueNumber, acDescription);

      // Then
      expect(result.success).toBe(true);
      
      const updatedBody = mockClient.getIssueBodySync(204);
      expect(updatedBody).toContain('- [x] Extract AC-N prefix when present');
    });

    it('should handle special characters in AC descriptions', async () => {
      // Given - Set up issue with special characters
      mockClient.setIssueBody(500, `
- [ ] Handle émojis 🚀 and symbols @#$%
- [ ] Parse "quoted text" correctly
- [ ] Support & ampersands & other HTML entities
`);
      
      // When
      const result = await updateIssueAC(500, 'émojis 🚀');

      // Then
      expect(result.success).toBe(true);
      
      const updatedBody = mockClient.getIssueBodySync(500);
      expect(updatedBody).toContain('- [x] Handle émojis 🚀 and symbols @#$%');
    });

    it('should handle multiple identical partial matches by marking the first', async () => {
      // Given - Issue with similar ACs
      mockClient.setIssueBody(501, `
- [ ] Create CLI command for parsing data
- [ ] Create CLI command for generation
- [ ] Create CLI command for validation
`);

      // When
      const result = await updateIssueAC(501, 'CLI command for');

      // Then
      expect(result.success).toBe(true);
      
      const updatedBody = mockClient.getIssueBodySync(501);
      expect(updatedBody).toContain('- [x] Create CLI command for parsing data');
      expect(updatedBody).toContain('- [ ] Create CLI command for generation'); // Others unchanged
      expect(updatedBody).toContain('- [ ] Create CLI command for validation');
    });
  });

  describe('Text-based criterion marking (unit tests)', () => {
    it('should mark criterion by exact text match', () => {
      // Given
      const issueBody = `
- [ ] First criterion
- [ ] Second criterion with specific text
- [ ] Third criterion
`;

      // When
      const result = markCriterionCompleteByText(issueBody, 'specific text');

      // Then
      expect(result).toContain('- [ ] First criterion');
      expect(result).toContain('- [x] Second criterion with specific text');
      expect(result).toContain('- [ ] Third criterion');
    });

    it('should handle empty issue body', () => {
      // When/Then
      expect(() => markCriterionCompleteByText('', 'any text'))
        .toThrow('Issue body is required');
    });

    it('should handle empty description', () => {
      // When/Then
      expect(() => markCriterionCompleteByText('- [ ] Some AC', ''))
        .toThrow('Description is required');
    });
  });
});