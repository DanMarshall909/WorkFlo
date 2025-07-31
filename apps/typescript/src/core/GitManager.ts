import { execSync, spawn } from 'child_process';
import { Logger } from './logger';

export interface GitCommitOptions {
  message: string;
  allowEmpty?: boolean;
}

export interface IssueData {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
}

export interface PullRequestData {
  number: number;
  title: string;
  body: string;
  url: string;
  state: 'open' | 'closed' | 'merged';
}

export class GitManager {
  
  // Git operations
  getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      throw new Error('Failed to get current branch. Are you in a git repository?');
    }
  }

  branchExists(branchName: string): boolean {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  createAndSwitchBranch(branchName: string): void {
    try {
      execSync(`git checkout -b "${branchName}"`, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Failed to create and switch to branch: ${branchName}`);
    }
  }

  switchBranch(branchName: string): void {
    try {
      execSync(`git checkout "${branchName}"`, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Failed to switch to branch: ${branchName}`);
    }
  }

  hasChanges(): boolean {
    try {
      execSync('git diff --quiet', { stdio: 'ignore' });
      return false; // No changes if git diff --quiet succeeds
    } catch {
      return true; // Changes exist if git diff --quiet fails
    }
  }

  stageAll(): void {
    try {
      execSync('git add .', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Failed to stage changes');
    }
  }

  commit(options: GitCommitOptions): void {
    try {
      const allowEmptyFlag = options.allowEmpty ? '--allow-empty' : '';
      const escapedMessage = options.message.replace(/"/g, '\\"');
      execSync(`git commit ${allowEmptyFlag} -m "${escapedMessage}"`, { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Failed to create commit');
    }
  }

  autoCommit(message: string): void {
    try {
      this.stageAll();
      this.commit({ message });
      logger.success('💾 Auto-committed changes');
    } catch (error) {
      logger.warn('⚠️  Auto-commit failed (continuing anyway)');
    }
  }

  getCommitCount(baseBranch: string = 'master'): number {
    try {
      const result = execSync(`git rev-list --count HEAD ^${baseBranch}`, { encoding: 'utf8' });
      return parseInt(result.trim()) || 0;
    } catch {
      return 0;
    }
  }

  // GitHub CLI operations
  checkGithubAuth(): void {
    try {
      execSync('gh auth status', { stdio: 'ignore' });
    } catch {
      throw new Error('GitHub CLI not authenticated. Run: gh auth login');
    }
  }

  checkPrerequisites(): void {
    const commands = [
      { cmd: 'gh --version', error: 'GitHub CLI required: https://cli.github.com/' },
      { cmd: 'jq --version', error: 'jq required: sudo apt-get install jq' },
      { cmd: 'bc --version', error: 'bc required: sudo apt-get install bc' }
    ];

    for (const { cmd, error } of commands) {
      try {
        execSync(cmd, { stdio: 'ignore' });
      } catch {
        throw new Error(error);
      }
    }

    this.checkGithubAuth();
  }

  issueExists(issueNumber: string): boolean {
    try {
      execSync(`gh issue view "${issueNumber}"`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  getIssueData(issueNumber: string): IssueData {
    try {
      const result = execSync(`gh issue view "${issueNumber}" --json number,title,body,state`, { encoding: 'utf8' });
      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Failed to get issue #${issueNumber}: ${error}`);
    }
  }

  getAcceptanceCriteria(issueNumber: string): string[] {
    const issueData = this.getIssueData(issueNumber);
    return issueData.body
      .split('\n')
      .filter(line => line.match(/^- \[ \]/))
      .map(line => line.replace(/^- \[ \] /, ''));
  }

  getCriteriaText(issueNumber: string, criteriaIndex: number): string {
    const criteria = this.getAcceptanceCriteria(issueNumber);
    return criteria[criteriaIndex - 1] || '';
  }

  countAcceptanceCriteria(issueNumber: string): number {
    return this.getAcceptanceCriteria(issueNumber).length;
  }

  createIssue(title: string, body: string, labels?: string[]): number {
    try {
      const labelFlag = labels && labels.length > 0 ? `--label "${labels.join(',')}"` : '';
      const result = execSync(`gh issue create --title "${title}" --body "${body}" ${labelFlag}`, { encoding: 'utf8' });
      const match = result.match(/#(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      throw new Error(`Failed to create issue: ${error}`);
    }
  }

  commentOnIssue(issueNumber: string, comment: string): void {
    try {
      execSync(`gh issue comment "${issueNumber}" --body "${comment}"`, { stdio: 'ignore' });
    } catch (error) {
      logger.warn(`Failed to comment on issue #${issueNumber}`);
    }
  }

  closeIssue(issueNumber: string, comment?: string): void {
    try {
      const commentFlag = comment ? `--comment "${comment}"` : '';
      execSync(`gh issue close "${issueNumber}" ${commentFlag}`, { stdio: 'ignore' });
    } catch (error) {
      throw new Error(`Failed to close issue #${issueNumber}`);
    }
  }

  createPullRequest(title: string, body: string, baseBranch: string = 'master'): PullRequestData {
    try {
      const currentBranch = this.getCurrentBranch();
      const result = execSync(
        `gh pr create --title "${title}" --body "${body}" --base ${baseBranch} --head ${currentBranch}`,
        { encoding: 'utf8' }
      );
      
      // Extract PR URL from output
      const urlMatch = result.match(/https:\/\/github\.com\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : '';
      
      // Extract PR number from URL
      const numberMatch = url.match(/\/pull\/(\d+)$/);
      const number = numberMatch ? parseInt(numberMatch[1]) : 0;
      
      return {
        number,
        title,
        body,
        url,
        state: 'open'
      };
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error}`);
    }
  }

  pushBranch(branchName?: string): void {
    try {
      const branch = branchName || this.getCurrentBranch();
      execSync(`git push origin "${branch}"`, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Failed to push branch: ${error}`);
    }
  }

  pushBranchWithUpstream(branchName?: string): void {
    try {
      const branch = branchName || this.getCurrentBranch();
      execSync(`git push -u origin "${branch}"`, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Failed to push branch with upstream: ${error}`);
    }
  }

  // Repository information
  getRepositoryOwner(): string {
    try {
      const result = execSync('gh repo view --json owner', { encoding: 'utf8' });
      return JSON.parse(result).owner.login;
    } catch (error) {
      throw new Error('Failed to get repository owner');
    }
  }

  getRepositoryName(): string {
    try {
      const result = execSync('gh repo view --json name', { encoding: 'utf8' });
      return JSON.parse(result).name;
    } catch (error) {
      throw new Error('Failed to get repository name');
    }
  }

  isInGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  // Utility methods
  generateBranchName(issueNumber: string): string {
    return `feature/issue-${issueNumber}`;
  }

  generateCommitMessage(phase: string, criteriaNum: number, criteriaText: string, issueNumber: string, issueTitle?: string): string {
    const phaseEmojis = {
      'RED': '🔴RED',
      'GREEN': '🟢GRN',
      'REFACTOR': '🔵REF',
      'COVER': '🟣COV'
    };

    const phaseAbbrev = phaseEmojis[phase as keyof typeof phaseEmojis] || phase;
    const currentBranch = this.getCurrentBranch();
    const title = issueTitle || `Issue ${issueNumber}`;

    return `${phaseAbbrev}: criteria ${criteriaNum} - ${criteriaText}

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
  }
}