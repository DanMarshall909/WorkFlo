import { Args, Flags } from '@oclif/core';
import { parseAcceptanceCriteria } from '../acceptance-criteria-parser';
import { BaseCommand } from '../base-command';

export default class ParseAc extends BaseCommand {
  static override description = 'Parse acceptance criteria from GitHub issue';

  static override examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --json',
    '<%= config.bin %> <%= command.id %> --body "- [ ] First criteria\\n- [ ] Second criteria"',
  ];

  static override flags = {
    body: Flags.string({ description: 'Issue body text' }),
    json: Flags.boolean({ description: 'Output as JSON' }),
  };

  static override args = {
    issue: Args.string({ description: 'GitHub issue number', required: false }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParseAc);

    try {
      let issueBody: string;

      if (args.issue) {
        const issueNumber = this.validateIssueNumber(args.issue);
        const issue = this.fetchGitHubIssue(issueNumber.toString(), 'body');
        issueBody = issue.body;
      } else if (flags.body) {
        issueBody = flags.body;
      } else {
        this.error('Either issue number or --body must be provided');
      }

      const criteria = parseAcceptanceCriteria(issueBody);
      
      if (flags.json) {
        this.log(JSON.stringify({
          criteria: criteria.map((item, index) => ({
            index: index + 1,
            item,
            checked: false
          })),
          total: criteria.length,
          completed: 0
        }, null, 2));
      } else {
        if (criteria.length === 0) {
          this.log('No acceptance criteria found');
        } else {
          this.log(`Found ${criteria.length} acceptance criteria:`);
          criteria.forEach((criterion, index) => {
            this.log(`${index + 1}. ${criterion}`);
          });
        }
      }
    } catch (error: unknown) {
      this.handleError(error, 'Failed to parse acceptance criteria');
    }
  }
}