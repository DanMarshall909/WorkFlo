import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { TddStateService } from '../../services/tdd-state';

export default class TddNext extends BaseCommand {
  static override description = 'Move to next acceptance criteria (HARD STOP)';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  override async run(): Promise<void> {
    const state = TddStateService.loadState();
    if (!state) {
      this.error('No active TDD session');
    }

    Logger.success(`✅ Acceptance criteria ${state.criteria} completed!`);

    const hasNext = TddStateService.nextCriteria();

    if (!hasNext) {
      Logger.success(`🎉 ALL ${state.total} acceptance criteria completed for issue #${state.issue}!`);
      
      this.log('');
      Logger.info(`✅ Issue #${state.issue} is complete and ready for PR`);
      Logger.info('💡 Next step: Create Pull Request when ready');
      this.log('');
      
      TddStateService.clearState();
      return;
    }

    // const newState = TddStateService.loadState()!; // TODO: Use if needed
    
    this.log('');
    Logger.info('Moving to next acceptance criteria...');
    Logger.warn('🛑 HARD STOP');
    Logger.warn('To prevent scope creep, you must explicitly continue');
    this.log('');
    Logger.info('To continue: flo tdd red');
  }
}