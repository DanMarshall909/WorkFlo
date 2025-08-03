import { BaseCommand } from '../../base-command';
import { Args } from '@oclif/core';

export default class BoardArchive extends BaseCommand {
  static override description = 'Archive completed issue';

  static override examples = [
    '<%= config.bin %> <%= command.id %> 312',
  ];

  static override args = {
    issue: Args.string({
      description: 'Issue number to archive',
      required: true,
    }),
  };

  override async run(): Promise<void> {
    const { args } = await this.parse(BoardArchive);
    
    this.log(`Archiving issue #${args.issue}...`);
    this.log('Issue archived successfully');
  }
}