import { Args, Flags } from '@oclif/core';
import { AutoWorkflowStateService } from '../../auto-state';
import { parseAcceptanceCriteria } from '../../acceptance-criteria-parser';
import { BaseCommand } from '../../base-command';
import { execSync } from 'child_process';
import * as path from 'path';

export default class AutoInit extends BaseCommand {
  static override description = 'Initialize TDD session and auto workflow state';

  static override examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --state-only',
  ];

  static override args = {
    issue: Args.string({ description: 'GitHub issue number', required: true }),
  };

  static override flags = {
    'state-only': Flags.boolean({ description: 'Initialize state management only, skip TDD session' }),
    json: Flags.boolean({ description: 'Output structured JSON for machine parsing' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AutoInit);

    try {
      const issueNumber = this.validateIssueNumber(args.issue);
      
      // Get acceptance criteria count
      const issueData = this.fetchGitHubIssue(issueNumber.toString(), 'body');
      const issueBody = (issueData as { body: string }).body;
      const criteria = parseAcceptanceCriteria(issueBody);
      
      if (criteria.length === 0) {
        this.error('No acceptance criteria found to track');
      }

      if (!flags['state-only']) {
        // Initialize TDD session first
        if (process.env['NODE_ENV'] !== 'test') {
          execSync(`./tdd start ${issueNumber}`, { 
            cwd: path.resolve(process.cwd(), '..'),
            stdio: 'inherit'
          });
        }
      }

      // Initialize state management
      const stateService = new AutoWorkflowStateService();
      await stateService.initializeState(issueNumber, criteria.length);
      
      const result = {
        issue: issueNumber,
        criteriaCount: criteria.length,
        message: `Auto workflow initialized for issue #${issueNumber}`,
        tddSession: !flags['state-only'],
        stateManagement: true
      };

      if (flags.json) {
        this.log(JSON.stringify(result, null, 2));
      } else {
        this.log(`🚀 Auto workflow initialized for issue #${issueNumber}`);
        this.log(`📊 Tracking ${criteria.length} acceptance criteria`);
        this.log(`📍 Current AC: 1, Phase: START`);
        if (!flags['state-only']) {
          this.log('✅ TDD session started');
        }
        this.log('✅ State management initialized');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.error(`Failed to initialize auto workflow: ${message}`);
    }
  }
}