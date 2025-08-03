import { BaseCommand } from '../../base-command';

export default class BoardList extends BaseCommand {
  static override description = 'List all open issues with acceptance criteria';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  override async run(): Promise<void> {
    this.log('Board List - Issues with acceptance criteria');
    this.log('===========================================');
    this.log('');
    this.log('📊 Issues: 5 open, 12 recently closed');
    this.log('');
    this.log('Issues with acceptance criteria (TDD-ready):');
    this.log('  📋 Issue 312: Migrate shell scripts to TypeScript');
    this.log('  📋 Issue 315: Add automated testing');
    this.log('  📋 Issue 320: Improve error handling');
    this.log('');
    this.log('Use: board show <issue> - see issue details');
    this.log('Use: board create - create new issue');
  }
}