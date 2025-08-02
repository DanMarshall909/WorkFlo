import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { TddStateService } from '../../services/tdd-state';

export default class TddStatus extends BaseCommand {
  static description = 'Show current TDD session status';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    const state = TddStateService.loadState();
    
    if (!state) {
      Logger.warn('No active TDD session');
      Logger.info('Start with: flo tdd start <issue_number>');
      return;
    }

    this.log('');
    this.log('📊 TDD Session Status');
    this.log('====================');
    this.log(`Issue: #${state.issue}`);
    this.log(`Progress: ${state.criteria}/${state.total} acceptance criteria`);
    this.log(`Current Phase: ${state.phase}`);
    this.log('');

    switch (state.phase) {
      case 'START':
        Logger.info('Next: flo tdd red');
        break;
      case 'RED':
        Logger.info('Next: flo tdd green');
        break;
      case 'GREEN':
        Logger.info('Next: flo tdd refactor OR flo tdd cover');
        break;
      case 'REFACTOR':
        Logger.info('Next: flo tdd cover');
        break;
      case 'COVER':
        Logger.info('Next: flo tdd next');
        break;
    }
  }
}