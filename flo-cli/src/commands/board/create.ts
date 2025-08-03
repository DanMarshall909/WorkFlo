import { BaseCommand } from '../../base-command';

export default class BoardCreate extends BaseCommand {
  static override description = 'Create new issue with acceptance criteria';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  override async run(): Promise<void> {
    this.log('Create New Issue');
    this.log('================');
    this.log('');
    this.log('Interactive issue creation would start here...');
    this.log('Use: gh issue create for now');
  }
}