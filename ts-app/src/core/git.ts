// Functional git and GitHub operations

import { execSync } from 'child_process';
import { Result, Ok, Err, GitHubApiError, IssueData } from './types';

// Git operations
export const getCurrentBranch = (): Result<string> => {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    return Ok(branch);
  } catch (error) {
    return Err(new Error('Failed to get current branch. Are you in a git repository?'));
  }
};

export const branchExists = (branchName: string): boolean => {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

export const createAndSwitchBranch = (branchName: string): Result<void> => {
  try {
    execSync(`git checkout -b "${branchName}"`, { stdio: 'inherit' });
    return Ok(undefined);
  } catch (error) {
    return Err(new Error(`Failed to create and switch to branch: ${branchName}`));
  }
};

export const switchBranch = (branchName: string): Result<void> => {
  try {
    execSync(`git checkout "${branchName}"`, { stdio: 'inherit' });
    return Ok(undefined);
  } catch (error) {
    return Err(new Error(`Failed to switch to branch: ${branchName}`));
  }
};

export const hasChanges = (): boolean => {
  try {
    execSync('git diff --quiet', { stdio: 'ignore' });
    return false; // No changes if git diff --quiet succeeds
  } catch {
    return true; // Changes exist if git diff --quiet fails
  }
};

export const stageAll = (): Result<void> => {
  try {
    execSync('git add .', { stdio: 'ignore' });
    return Ok(undefined);
  } catch (error) {
    return Err(new Error('Failed to stage changes'));
  }
};

export const commit = (message: string, allowEmpty = false): Result<void> => {
  try {
    const allowEmptyFlag = allowEmpty ? '--allow-empty' : '';
    const escapedMessage = message.replace(/"/g, '\\"');
    execSync(`git commit ${allowEmptyFlag} -m "${escapedMessage}"`, { stdio: 'ignore' });
    return Ok(undefined);
  } catch (error) {
    return Err(new Error('Failed to create commit'));
  }
};

export const autoCommit = (message: string): Result<void> => {
  const stageResult = stageAll();
  if (!stageResult.success) return stageResult;
  
  return commit(message);
};

export const getCommitCount = (baseBranch = 'master'): number => {
  try {
    const result = execSync(`git rev-list --count HEAD ^${baseBranch}`, { encoding: 'utf8' });
    return parseInt(result.trim()) || 0;
  } catch {
    return 0;
  }
};

export const isInGitRepository = (): boolean => {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

// GitHub CLI operations
export const checkGithubAuth = (): Result<void> => {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return Ok(undefined);
  } catch {
    return Err(new Error('GitHub CLI not authenticated. Run: gh auth login'));
  }
};

export const checkPrerequisites = (): Result<void> => {
  const commands = [
    { cmd: 'gh --version', error: 'GitHub CLI required: https://cli.github.com/' },
    { cmd: 'jq --version', error: 'jq required: sudo apt-get install jq' },
    { cmd: 'bc --version', error: 'bc required: sudo apt-get install bc' }
  ];

  for (const { cmd, error } of commands) {
    try {
      execSync(cmd, { stdio: 'ignore' });
    } catch {
      return Err(new Error(error));
    }
  }

  return checkGithubAuth();
};

export const issueExists = (issueNumber: string): boolean => {
  try {
    execSync(`gh issue view "${issueNumber}"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

export const getIssueData = (issueNumber: string): Result<IssueData> => {
  try {
    const result = execSync(`gh issue view "${issueNumber}" --json number,title,body,state`, { encoding: 'utf8' });
    const data = JSON.parse(result);
    return Ok(data);
  } catch (error) {
    return Err(new GitHubApiError(`Failed to get issue #${issueNumber}: ${error}`));
  }
};

export const getAcceptanceCriteria = (issueNumber: string): Result<string[]> => {
  const issueResult = getIssueData(issueNumber);
  if (!issueResult.success) return issueResult;
  
  const criteria = issueResult.data.body
    .split('\n')
    .filter(line => line.match(/^- \[ \]/))
    .map(line => line.replace(/^- \[ \] /, ''));
    
  return Ok(criteria);
};

export const getCriteriaText = (issueNumber: string, criteriaIndex: number): Result<string> => {
  const criteriaResult = getAcceptanceCriteria(issueNumber);
  if (!criteriaResult.success) return criteriaResult;
  
  const text = criteriaResult.data[criteriaIndex - 1];
  if (!text) {
    return Err(new Error(`No acceptance criteria found at position ${criteriaIndex}`));
  }
  
  return Ok(text);
};

export const countAcceptanceCriteria = (issueNumber: string): Result<number> => {
  const criteriaResult = getAcceptanceCriteria(issueNumber);
  if (!criteriaResult.success) return criteriaResult;
  
  const count = criteriaResult.data.length;
  if (count === 0) {
    return Err(new Error(`No acceptance criteria found in issue #${issueNumber}. Use format: - [ ] criterion`));
  }
  
  return Ok(count);
};

export const createIssue = (title: string, body: string, labels: string[] = []): Result<number> => {
  try {
    const labelFlag = labels.length > 0 ? `--label "${labels.join(',')}"` : '';
    const result = execSync(`gh issue create --title "${title}" --body "${body}" ${labelFlag}`, { encoding: 'utf8' });
    const match = result.match(/#(\d+)/);
    const issueNumber = match ? parseInt(match[1]) : 0;
    
    if (issueNumber === 0) {
      return Err(new GitHubApiError('Failed to extract issue number from response'));
    }
    
    return Ok(issueNumber);
  } catch (error) {
    return Err(new GitHubApiError(`Failed to create issue: ${error}`));
  }
};

export const commentOnIssue = (issueNumber: string, comment: string): Result<void> => {
  try {
    execSync(`gh issue comment "${issueNumber}" --body "${comment}"`, { stdio: 'ignore' });
    return Ok(undefined);
  } catch (error) {
    return Err(new GitHubApiError(`Failed to comment on issue #${issueNumber}: ${error}`));
  }
};

export const closeIssue = (issueNumber: string, comment?: string): Result<void> => {
  try {
    const commentFlag = comment ? `--comment "${comment}"` : '';
    execSync(`gh issue close "${issueNumber}" ${commentFlag}`, { stdio: 'ignore' });
    return Ok(undefined);
  } catch (error) {
    return Err(new GitHubApiError(`Failed to close issue #${issueNumber}: ${error}`));
  }
};

export const getRepositoryOwner = (): Result<string> => {
  try {
    const result = execSync('gh repo view --json owner', { encoding: 'utf8' });
    const data = JSON.parse(result);
    return Ok(data.owner.login);
  } catch (error) {
    return Err(new GitHubApiError('Failed to get repository owner'));
  }
};

export const getRepositoryName = (): Result<string> => {
  try {
    const result = execSync('gh repo view --json name', { encoding: 'utf8' });
    const data = JSON.parse(result);
    return Ok(data.name);
  } catch (error) {
    return Err(new GitHubApiError('Failed to get repository name'));
  }
};

// Utility functions
export const generateBranchName = (issueNumber: string): string => {
  return `feature/issue-${issueNumber}`;
};

export const generateCommitMessage = (
  phase: string, 
  criteriaNum: number, 
  criteriaText: string, 
  issueNumber: string, 
  issueTitle?: string
): Result<string> => {
  const branchResult = getCurrentBranch();
  const currentBranch = branchResult.success ? branchResult.data : 'unknown';
  
  const phaseEmojis: Record<string, string> = {
    'RED': '🔴RED',
    'GREEN': '🟢GRN',
    'REFACTOR': '🔵REF',
    'COVER': '🟣COV'
  };

  const phaseAbbrev = phaseEmojis[phase] || phase;
  const title = issueTitle || `Issue ${issueNumber}`;

  const message = `${phaseAbbrev}: criteria ${criteriaNum} - ${criteriaText}

Issue: #${issueNumber} - ${title}
Criteria: ${criteriaNum}/total
Phase: ${phase}
Branch: ${currentBranch}

Changes:
- TDD ${phase} phase implementation
- Focus: ${criteriaText}

Linked-to: #${issueNumber}
TDD-Phase: ${phase}
Criteria-Progress: ${criteriaNum}/total

🤖 Generated with WorkFlo TDD automation`;

  return Ok(message);
};