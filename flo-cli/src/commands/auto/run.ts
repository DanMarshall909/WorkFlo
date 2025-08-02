import { Args, Flags } from '@oclif/core';
import { parseAcceptanceCriteria } from '../../acceptance-criteria-parser';
import { BaseCommand } from '../../base-command';

export default class AutoRun extends BaseCommand {
  static override description = 'Run autonomous TDD workflow for multiple acceptance criteria';

  static override examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --parse-only',
  ];

  static override args = {
    issue: Args.string({ description: 'GitHub issue number', required: true }),
  };

  static override flags = {
    'parse-only': Flags.boolean({ description: 'Parse issue and show acceptance criteria count only' }),
    json: Flags.boolean({ description: 'Output structured JSON for machine parsing' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AutoRun);

    try {
      const issueNumber = this.validateIssueNumber(args.issue);
      const issueData = this.fetchGitHubIssue(issueNumber.toString(), 'body');
      const issueBody = issueData.body;
      const criteria = parseAcceptanceCriteria(issueBody);
      
      if (flags['parse-only']) {
        const result = {
          issue: issueNumber,
          criteriaCount: criteria.length,
          criteria: criteria,
          message: criteria.length === 0 ? 'No acceptance criteria found' : `Found ${criteria.length} acceptance criteria`
        };

        if (flags.json) {
          this.log(JSON.stringify(result, null, 2));
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
        return;
      }

      if (criteria.length === 0) {
        this.error('No acceptance criteria found for autonomous workflow');
      }

      // Display workflow plan
      this.log(`🚀 Starting autonomous TDD workflow for issue #${issueNumber}`);
      this.log(`📊 Processing ${criteria.length} acceptance criteria`);
      this.log('');
      this.log('Workflow plan:');
      criteria.forEach((criterion, index) => {
        this.log(`${index + 1}. ${criterion}`);
      });
      this.log('');
      this.log('Next steps:');
      this.log('1. Run: flo-cli auto:init ' + issueNumber + ' to initialize TDD session');
      this.log('2. Follow the TDD workflow for each acceptance criteria');
      this.log('3. Use: flo-cli auto:status to check progress');

    } catch (error: unknown) {
      this.handleError(error, 'Failed to run auto workflow');
    }
  }
}