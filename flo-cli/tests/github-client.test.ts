/**
 * @group issue-204
 * @group ac-5
 * @group github-integration
 */

import { MockGitHubClient } from './__mocks__/github-client';

describe('Issue #204: GitHub Client Tests', () => {
  describe('MockGitHubClient', () => {
    let client: MockGitHubClient;

    beforeEach(() => {
      client = new MockGitHubClient();
    });

    afterEach(() => {
      client.reset();
    });

    it('should fetch issue successfully', async () => {
      // When
      const result = await client.getIssue(204);

      // Then
      expect(result.number).toBe(204);
      expect(result.title).toBe('Parse and validate acceptance criteria from GitHub issues');
      expect(result.body).toContain('## Acceptance Criteria');
    });

    it('should update issue body successfully', async () => {
      // Given
      const newBody = 'Updated body content';

      // When
      await client.updateIssue(204, newBody);
      const result = await client.getIssue(204);

      // Then
      expect(result.body).toBe(newBody);
    });

    it('should throw error for non-existent issue', async () => {
      // When/Then
      await expect(client.getIssue(999)).rejects.toThrow('Issue #999 not found');
    });

    it('should allow setting mock issues', async () => {
      // Given
      const mockIssue = {
        number: 123,
        title: 'Test Issue',
        body: 'Test body'
      };

      // When
      client.setMockIssue(mockIssue);
      const result = await client.getIssue(123);

      // Then
      expect(result).toEqual(mockIssue);
    });

    it('should reset to initial state', async () => {
      // Given
      client.setMockIssue({
        number: 204,
        title: 'Modified',
        body: 'Modified body'
      });

      // When
      client.reset();
      const result = await client.getIssue(204);

      // Then
      expect(result.title).toBe('Parse and validate acceptance criteria from GitHub issues');
    });
  });
});