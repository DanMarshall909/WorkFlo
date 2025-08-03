import { BaseCommand } from '../../base-command';
import { Args } from '@oclif/core';

export default class BoardShow extends BaseCommand {
  static override description = 'Show issue details and acceptance criteria';

  static override examples = [
    '<%= config.bin %> <%= command.id %> 312',
  ];

  static override args = {
    issue: Args.string({
      description: 'Issue number to show',
      required: true,
    }),
  };

  override async run(): Promise<void> {
    const { args } = await this.parse(BoardShow);
    
    this.log(`Issue #${args.issue} Details`);
    this.log('=======================');
    this.log('');
    this.log('Status: Open');
    this.log('Title: Example Issue');
    this.log('');
    this.log('Acceptance Criteria:');
    this.log('- [ ] First criterion');
    this.log('- [ ] Second criterion');
    this.log('');
  }
}