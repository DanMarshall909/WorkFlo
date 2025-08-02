/**
 * @group issue-204
 * @group ac-5
 * @group integration
 */

import { updateIssue, markCriterionCompleteByText } from '../src/issue-updater';

// Mock child_process to avoid actual GitHub CLI calls
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Mock fs to avoid actual file operations
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn()
}));

import { execSync } from 'child_process';
import * as fs from 'fs';

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;

describe('Issue #204: GitHub Integration with Mocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC-5: Create CLI command with GitHub integration', () => {
    it('should successfully mark acceptance criterion as complete', async () => {
      // Given
      const issueNumber = 204;
      const acDescription = 'Handle various markdown checkbox formats';
      const mockIssueBody = `Create functionality to parse and validate acceptance criteria from GitHub issues.

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
- [ ] Create CLI command for generation: \`flo-cli generate-tests\``;

      // Mock GitHub CLI calls
      mockExecSync
        .mockReturnValueOnce(JSON.stringify({ body: mockIssueBody })) // gh issue view
        .mockReturnValueOnce(''); // gh issue edit

      // When
      const result = await updateIssue(issueNumber, acDescription);

      // Then
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully marked as complete');
      expect(mockExecSync).toHaveBeenCalledWith(`gh issue view ${issueNumber} --json body`, { encoding: 'utf-8' });
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should handle missing acceptance criteria', async () => {
      // Given
      const issueNumber = 204;
      const acDescription = 'Nonexistent acceptance criteria';
      const mockIssueBody = `No acceptance criteria here`;

      mockExecSync.mockReturnValueOnce(JSON.stringify({ body: mockIssueBody }));

      // When
      const result = await updateIssue(issueNumber, acDescription);

      // Then
      expect(result.success).toBe(false);
      expect(result.message).toContain('Could not find matching acceptance criteria');
    });

    it('should handle GitHub CLI errors', async () => {
      // Given
      const issueNumber = 999;
      const acDescription = 'Some criteria';

      mockExecSync.mockImplementation(() => {
        throw new Error('Issue not found');
      });

      // When
      const result = await updateIssue(issueNumber, acDescription);

      // Then
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to update issue');
    });

    it('should handle empty issue body', async () => {
      // Given
      const acDescription = 'any text';

      mockExecSync.mockReturnValueOnce(JSON.stringify({ body: '' }));

      // When
      const result = await markCriterionCompleteByText(456, acDescription);

      // Then
      expect(result.success).toBe(false);
      expect(result.message).toContain('Could not find matching acceptance criteria');
    });

    it('should handle missing criterion text', async () => {
      // Given
      const acDescription = 'nonexistent text';

      mockExecSync.mockReturnValueOnce(JSON.stringify({ body: '- [ ] Some AC' }));

      // When
      const result = await markCriterionCompleteByText(789, acDescription);

      // Then
      expect(result.success).toBe(false);
      expect(result.message).toContain('Could not find matching acceptance criteria');
    });
  });
});