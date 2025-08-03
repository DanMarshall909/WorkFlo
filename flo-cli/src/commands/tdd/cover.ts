import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { TddStateService } from '../../services/tdd-state';
import { execSync } from 'child_process';

export default class TddCover extends BaseCommand {
  static override description = 'Add comprehensive tests (COVER phase)';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  override async run(): Promise<void> {
    const state = TddStateService.loadState();
    if (!state) {
      this.error('No active TDD session');
    }

    // Check if we're running out of sequence
    if (state.phase !== 'REFACTOR' && state.phase !== 'GREEN' && state.phase !== 'COVER') {
      Logger.warn(`⚠️  AI AGENT HINT: Current phase is ${state.phase}, but COVER phase should follow REFACTOR or GREEN phase`);
      Logger.warn('💡 TDD workflow should be: RED → GREEN → REFACTOR → COVER → NEXT');
      Logger.warn('🤖 If you manually completed earlier phases, consider updating TDD state appropriately');
      this.log('');
    }

    Logger.info('📊 COVER Phase - Comprehensive test coverage');

    this.log('Add comprehensive test coverage for the current criteria.');
    this.log('Include:');
    this.log('  • Edge cases and boundary conditions');
    this.log('  • Error scenarios and exception handling');
    this.log('  • Different input variations');
    this.log('');

    // Verify all tests pass
    Logger.info('Running all tests...');
    if (!this.runTests()) {
      this.error('Tests must pass before completing COVER phase');
    }

    // Note: Mutation testing will run during PR submission
    Logger.info('Mutation testing will be performed during PR submission');

    TddStateService.updatePhase('COVER');
    Logger.success('COVER phase complete. Next: flo tdd next');
  }

  private runTests(): boolean {
    try {
      execSync('npm test', { stdio: 'ignore' });
      return true; // Tests passed
    } catch {
      return false; // Tests failed
    }
  }
}