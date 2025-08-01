/**
 * Simple tests for the issue-updater functionality
 * @group issue-updater
 * @group unit
 */

import { updateIssue, markCriterionComplete } from '../src/issue-updater';

describe('Issue Updater', () => {
  describe('updateIssue', () => {
    it('should be defined and callable', () => {
      expect(updateIssue).toBeDefined();
      expect(typeof updateIssue).toBe('function');
    });

    it('should return proper error for invalid issue', async () => {
      const result = await updateIssue(999999, 'test criteria');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to update issue');
    });
  });

  describe('legacy aliases', () => {
    it('should have legacy function aliases', () => {
      expect(markCriterionComplete).toBeDefined();
      expect(typeof markCriterionComplete).toBe('function');
    });

    it('should work the same as updateIssue', async () => {
      const result1 = await updateIssue(999999, 'test');
      const result2 = await markCriterionComplete(999999, 'test');
      
      expect(result1.success).toBe(result2.success);
      expect(result1.success).toBe(false); // Both should fail for invalid issue
    });
  });
});