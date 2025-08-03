import { Args } from '@oclif/core';
import { BaseCommand } from '../base-command';
import { execSync } from 'child_process';

export default class MarkAc extends BaseCommand {
  static override description = 'Mark acceptance criterion as complete';

  static override examples = [
    'flo mark-ac 312 "priority: critical"',
    'flo mark-ac 250 "Add auto subcommand"',
  ];

  static override args = {
    issue: Args.string({
      description: 'GitHub issue number',
      required: true,
    }),
    description: Args.string({
      description: 'Acceptance criteria description',
      required: true,
    }),
  };

  override async run(): Promise<void> {
    const { args } = await this.parse(MarkAc);
    const issueNumber = this.validateIssueNumber(args.issue);
    const description = args.description;

    try {
      // Use the existing update-issue-ac command
      execSync(`node dist/cli.js update-issue-ac ${issueNumber} "${description}"`, { 
        encoding: 'utf8',
        stdio: 'inherit' 
      });
      
      this.log('Acceptance criterion marked as complete');
    } catch (error) {
      this.handleError(error, 'Failed to mark acceptance criterion as complete');
    }
  }
}