import { Args } from '@oclif/core';
import { updateIssue } from '../issue-updater';
import { BaseCommand } from '../base-command';

export default class UpdateIssueAc extends BaseCommand {
  static override description = 'Update acceptance criteria status in GitHub issue';

  static override examples = [
    '<%= config.bin %> <%= command.id %> 123 "Add CLI command for generation"',
  ];

  static override args = {
    issue: Args.string({ description: 'GitHub issue number', required: true }),
    criteria: Args.string({ description: 'Acceptance criteria text to update', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(UpdateIssueAc);

    try {
      const issueNumber = this.validateIssueNumber(args.issue);
      const result = await updateIssue(issueNumber, args.criteria);
      this.log(result.message);
    } catch (error: unknown) {
      this.handleError(error, 'Failed to update issue');
    }
  }
}