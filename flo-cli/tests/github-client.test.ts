/**
 * @group issue-204
 * @group ac-5
 * @group github-integration
 */

import { GitHubCLIClient, MockGitHubClient } from '../src/github-client';
import * as childProcess from 'child_process';
import * as fs from 'fs';

// Mock child_process and fs modules
jest.mock('child_process');
jest.mock('fs');

const mockExecSync = childProcess.execSync as jest.MockedFunction<typeof childProcess.execSync>;
const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;
const mockUnlinkSync = fs.unlinkSync as jest.MockedFunction<typeof fs.unlinkSync>;

describe('Issue #204: GitHub Client Tests', () => {
  describe('GitHubCLIClient', () => {
    let client: GitHubCLIClient;

    beforeEach(() => {
      client = new GitHubCLIClient();
      jest.clearAllMocks();
    });

    describe('getIssueBody', () => {
      it('should fetch issue body successfully', async () => {
        // Given
        const mockResponse = JSON.stringify({
          body: 'Test issue body with acceptance criteria'
        });
        mockExecSync.mockReturnValue(mockResponse);

        // When
        const result = await client.getIssueBody(204);

        // Then
        expect(result).toBe('Test issue body with acceptance criteria');
        expect(mockExecSync).toHaveBeenCalledWith(
          'gh issue view 204 --json body',
          { encoding: 'utf-8' }
        );
      });

      it('should handle GitHub CLI errors', async () => {
        // Given
        mockExecSync.mockImplementation(() => {
          throw new Error('gh: command not found');
        });

        // When/Then
        await expect(client.getIssueBody(204))
          .rejects.toThrow('Failed to fetch issue #204: gh: command not found');
      });

      it('should handle invalid JSON response', async () => {
        // Given
        mockExecSync.mockReturnValue('invalid json');

        // When/Then
        await expect(client.getIssueBody(204))
          .rejects.toThrow('Failed to fetch issue #204');
      });

      it('should handle network errors', async () => {
        // Given
        mockExecSync.mockImplementation(() => {
          throw new Error('network error');
        });

        // When/Then
        await expect(client.getIssueBody(999))
          .rejects.toThrow('Failed to fetch issue #999: network error');
      });
    });

    describe('updateIssueBody', () => {
      it('should update issue body successfully', async () => {
        // Given
        const issueNumber = 204;
        const newBody = 'Updated issue body';
        mockExecSync.mockReturnValue('');

        // When
        await client.updateIssueBody(issueNumber, newBody);

        // Then
        expect(mockWriteFileSync).toHaveBeenCalledWith(
          '/tmp/issue-204-body.md',
          newBody
        );
        expect(mockExecSync).toHaveBeenCalledWith(
          'gh issue edit 204 --body-file /tmp/issue-204-body.md'
        );
        expect(mockUnlinkSync).toHaveBeenCalledWith('/tmp/issue-204-body.md');
      });

      it('should clean up temp file on gh command error', async () => {
        // Given
        const issueNumber = 204;
        const newBody = 'Updated body';
        mockExecSync.mockImplementation(() => {
          throw new Error('gh edit failed');
        });

        // When/Then
        await expect(client.updateIssueBody(issueNumber, newBody))
          .rejects.toThrow('Failed to update issue #204: gh edit failed');

        // Verify cleanup was attempted
        expect(mockUnlinkSync).toHaveBeenCalledWith('/tmp/issue-204-body.md');
      });

      it('should handle file write errors', async () => {
        // Given
        const issueNumber = 204;
        const newBody = 'Updated body';
        mockWriteFileSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });

        // When/Then
        await expect(client.updateIssueBody(issueNumber, newBody))
          .rejects.toThrow('Failed to update issue #204: Permission denied');
      });

      it('should handle cleanup errors gracefully', async () => {
        // Given
        const issueNumber = 204;
        const newBody = 'Updated body';
        
        // Mock writeFileSync to succeed, then execSync to fail, then unlinkSync to fail
        mockWriteFileSync.mockReturnValue(undefined);
        mockExecSync.mockImplementation(() => {
          throw new Error('gh edit failed');
        });
        mockUnlinkSync.mockImplementation(() => {
          throw new Error('File not found');
        });

        // When/Then - should still throw the original error, not the cleanup error
        await expect(client.updateIssueBody(issueNumber, newBody))
          .rejects.toThrow('Failed to update issue #204: gh edit failed');
      });
    });
  });

  describe('MockGitHubClient', () => {
    it('should initialize with provided issues', async () => {
      // Given
      const initialIssues = {
        100: 'Issue 100 body',
        200: 'Issue 200 body'
      };

      // When
      const client = new MockGitHubClient(initialIssues);

      // Then
      expect(await client.getIssueBody(100)).toBe('Issue 100 body');
      expect(await client.getIssueBody(200)).toBe('Issue 200 body');
    });

    it('should initialize empty when no issues provided', async () => {
      // Given/When
      const client = new MockGitHubClient();

      // Then
      await expect(client.getIssueBody(100))
        .rejects.toThrow('Issue #100 not found');
    });

    it('should handle issue not found', async () => {
      // Given
      const client = new MockGitHubClient({ 100: 'Test body' });

      // When/Then
      await expect(client.getIssueBody(999))
        .rejects.toThrow('Issue #999 not found');
    });

    it('should update existing issues', async () => {
      // Given
      const client = new MockGitHubClient({ 100: 'Original body' });

      // When
      await client.updateIssueBody(100, 'Updated body');

      // Then
      expect(await client.getIssueBody(100)).toBe('Updated body');
    });

    it('should reject updates to non-existent issues', async () => {
      // Given
      const client = new MockGitHubClient();

      // When/Then
      await expect(client.updateIssueBody(999, 'New body'))
        .rejects.toThrow('Issue #999 not found');
    });

    it('should support test helper methods', () => {
      // Given
      const client = new MockGitHubClient();

      // When
      client.setIssueBody(100, 'Test body');

      // Then
      expect(client.getIssueBodySync(100)).toBe('Test body');
      expect(client.getIssueBodySync(999)).toBeUndefined();
    });
  });
});