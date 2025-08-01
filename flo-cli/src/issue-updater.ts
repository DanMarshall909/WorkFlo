import { execSync } from 'child_process';
import * as fs from 'fs';

/**
 * Updates a GitHub issue's acceptance criteria by description
 * @param issueNumber - The GitHub issue number
 * @param acDescription - Description of the AC to mark complete
 * @returns Promise that resolves with result
 */
export async function updateIssue(issueNumber: number, acDescription: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Get the current issue body
    const issueData = execSync(`gh issue view ${issueNumber} --json body`, { encoding: 'utf-8' });
    const issue = JSON.parse(issueData);
    const issueBody = issue.body;

    // Find and update the matching acceptance criteria
    const lines = issueBody.split('\n');
    let updated = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match unchecked criteria that contains the description
      if (line.match(/^\s*-\s*\[\s*\]/) && line.includes(acDescription)) {
        // Mark as complete by replacing [ ] with [x]
        lines[i] = line.replace(/^\s*-\s*\[\s*\]/, '- [x]');
        updated = true;
        break;
      }
    }

    if (!updated) {
      return {
        success: false,
        message: `Could not find matching acceptance criteria: ${acDescription}`
      };
    }

    // Update the issue with the modified body
    const updatedBody = lines.join('\n');
    
    // Write to temporary file to avoid shell escaping issues
    const tmpFile = `/tmp/issue-${issueNumber}-body.md`;
    fs.writeFileSync(tmpFile, updatedBody, 'utf-8');
    
    execSync(`gh issue edit ${issueNumber} --body-file "${tmpFile}"`, { encoding: 'utf-8' });

    return {
      success: true,
      message: `Successfully marked as complete: ${acDescription}`
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to update issue ${issueNumber}: ${message}`
    };
  }
}

// Legacy aliases for backward compatibility with tests
export async function markCriterionComplete(issueNumber: number, acDescription: string) {
  return await updateIssue(issueNumber, acDescription);
}

export async function markCriterionCompleteByText(issueNumber: number, acDescription: string) {
  return await updateIssue(issueNumber, acDescription);
}

export async function markCriterionCompleteById(issueNumber: number, acId: string) {
  return await updateIssue(issueNumber, acId);
}

export async function markComplete(issueNumber: number, acDescription: string) {
  return await updateIssue(issueNumber, acDescription);
}