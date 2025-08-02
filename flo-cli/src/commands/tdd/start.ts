import { Args } from '@oclif/core';
import { execSync } from 'child_process';
import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { ProjectDetector } from '../../services/project-detector';
import { TddStateService } from '../../services/tdd-state';

export default class TddStart extends BaseCommand {
  static description = 'Start TDD workflow for GitHub issue';

  static examples = [
    'flo tdd start 123',
    'flo tdd start 456',
  ];

  static args = {
    issue: Args.string({
      description: 'GitHub issue number',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(TddStart);
    const issueNumber = this.validateIssueNumber(args.issue);

    const projectType = ProjectDetector.detectProjectType();
    Logger.info(`Starting TDD workflow for issue #${issueNumber} (${projectType} project)`);

    this.checkPrerequisites();

    // Validate issue exists
    try {
      this.fetchGitHubIssue(args.issue, 'title,body');
    } catch (error) {
      this.handleError(error, `Issue #${issueNumber} not found`);
    }

    // Get issue details for branch naming
    const issueData = this.fetchGitHubIssue(args.issue, 'title,body');
    const branchName = `feature/issue-${issueNumber}`;

    // Handle branch creation/switching
    await this.handleBranch(branchName, issueNumber, issueData.title);

    // Count acceptance criteria
    const total = this.countAcceptanceCriteria(issueData.body);
    if (total === 0) {
      this.error(`No acceptance criteria found in issue #${issueNumber} (use '- [ ] criteria' format)`);
    }

    // Save TDD state
    TddStateService.saveState({
      issue: issueNumber,
      criteria: 1,
      phase: 'START',
      total,
    });

    Logger.success(`Started issue #${issueNumber} with ${total} acceptance criteria`);
    Logger.success(`Working on branch: ${branchName}`);
    Logger.info('Next step: flo tdd red');
  }

  private checkPrerequisites(): void {
    const tools = [
      { name: 'gh', install: 'https://cli.github.com/' },
      { name: 'jq', install: 'sudo apt-get install jq' },
      { name: 'bc', install: 'sudo apt-get install bc' },
    ];

    for (const tool of tools) {
      try {
        execSync(`command -v ${tool.name}`, { stdio: 'ignore' });
      } catch {
        this.error(`${tool.name} not found. Install with: ${tool.install}`);
      }
    }

    // Check GitHub CLI authentication
    try {
      execSync('gh auth status', { stdio: 'ignore' });
    } catch {
      this.error('GitHub CLI not authenticated: gh auth login');
    }
  }

  private async handleBranch(branchName: string, issueNumber: number, issueTitle: string): Promise<void> {
    try {
      // Get current branch
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();

      if (currentBranch !== branchName) {
        // Check if branch exists
        try {
          execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
          Logger.info(`Switching to existing branch: ${branchName}`);
          execSync(`git checkout ${branchName}`);
        } catch {
          Logger.info(`Creating and switching to new branch: ${branchName}`);
          execSync(`git checkout -b ${branchName}`);

          // Link branch to issue immediately
          Logger.info(`Linking branch to issue #${issueNumber}`);
          const commitMessage = [
            `feat: initialize TDD workflow for issue #${issueNumber}`,
            '',
            issueTitle,
            '',
            `Linked-to: #${issueNumber}`,
            `Branch: ${branchName}`,
            'TDD-Session: START',
            '',
            '🤖 Generated with WorkFlo TDD automation'
          ].join('\\n');

          try {
            execSync(`git commit --allow-empty -m \"${commitMessage}\"`);
          } catch {
            Logger.warn('Failed to create initial commit');
          }
        }
      }
    } catch (error) {
      this.handleError(error, `Failed to handle branch ${branchName}`);
    }
  }

  private countAcceptanceCriteria(body: string): number {
    const regex = /^- \[ \]/gm;
    const matches = body.match(regex);
    return matches ? matches.length : 0;
  }
}