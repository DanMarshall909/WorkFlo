import { mockIssueWithUncheckedCriteria, mockIssueWithCheckedCriteria, mockIssueWithMixedCriteria } from './github-responses';

const realChildProcess = jest.requireActual('child_process');

export const execSync = jest.fn((command: string, options?: any) => {
  // Intercept gh issue view commands
  if (command.includes('gh issue view')) {
    const issueMatch = command.match(/gh issue view (\d+)/);
    if (issueMatch) {
      const issueNumber = issueMatch[1];
      
      // Return mock data for test issues
      if (issueNumber === '999') {
        return JSON.stringify(mockIssueWithUncheckedCriteria);
      } else if (issueNumber === '998') {
        return JSON.stringify(mockIssueWithCheckedCriteria);
      } else if (issueNumber === '997') {
        return JSON.stringify(mockIssueWithMixedCriteria);
      } else if (issueNumber === '250') {
        // For backward compatibility with existing tests
        return JSON.stringify(mockIssueWithUncheckedCriteria);
      }
    }
  }
  
  // Pass through all other commands
  return realChildProcess.execSync(command, options);
});