import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { TddStateService } from '../../services/tdd-state';
import { execSync } from 'child_process';
import { Flags } from '@oclif/core';

export default class TddRefactor extends BaseCommand {
  static override description = 'Improve code quality (REFACTOR phase)';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static override flags = {
    manual: Flags.boolean({
      description: 'Manual mode - stop after this phase instead of auto-proceeding',
      default: false,
    }),
  };

  override async run(): Promise<void> {
    const { flags } = await this.parse(TddRefactor);
    const state = TddStateService.loadState();
    if (!state) {
      this.error('No active TDD session');
    }

    // Check if we're running out of sequence
    if (state.phase !== 'GREEN' && state.phase !== 'REFACTOR') {
      Logger.warn(`⚠️  AI AGENT HINT: Current phase is ${state.phase}, but REFACTOR phase should follow GREEN phase`);
      Logger.warn('💡 TDD workflow should be: RED → GREEN → REFACTOR → COVER → NEXT');
      Logger.warn('🤖 If you manually implemented GREEN phase, consider updating TDD state first');
      this.log('');
    }

    Logger.info('🔵 REFACTOR Phase - Improve code quality');

    this.log('Improve the code while keeping all tests green.');
    this.log('Focus on:');
    this.log('  • Code readability and structure');
    this.log('  • Removing duplication');
    this.log('  • Better naming and organization');
    this.log('');

    // Check if changes were made
    if (this.hasNoChanges()) {
      Logger.info('No changes detected - skipping refactor commit');
    } else {
      // Verify tests still pass
      Logger.info('Verifying tests still pass after refactoring...');
      if (!this.runTestsWithSkip()) {
        this.error('Tests failing after refactor! Fix the refactoring');
      }
      Logger.success('✅ Tests still passing after refactor');
    }

    TddStateService.updatePhase('REFACTOR');
    
    if (flags.manual) {
      Logger.success('REFACTOR phase complete. Next: flo tdd cover');
    } else {
      Logger.success('REFACTOR phase complete. Auto-proceeding to COVER phase...');
      // Automatically proceed to COVER phase
      await this.proceedToNextPhase('cover');
    }
  }

  private hasNoChanges(): boolean {
    try {
      execSync('git diff --quiet', { stdio: 'ignore' });
      return true; // No changes
    } catch {
      return false; // Changes detected
    }
  }

  private runTestsWithSkip(): boolean {
    try {
      // Set environment variable to skip script tests, then run tests
      process.env['TDD_SKIP_SCRIPT_TESTS'] = '1';
      execSync('npm test', { stdio: 'ignore' });
      return true; // Tests passed
    } catch {
      return false; // Tests failed
    } finally {
      delete process.env['TDD_SKIP_SCRIPT_TESTS'];
    }
  }

  private async proceedToNextPhase(nextPhase: string): Promise<void> {
    try {
      // Import and run the next phase command dynamically
      const NextPhaseCommand = await import(`./${nextPhase}`);
      const nextCommand = new NextPhaseCommand.default([], this.config);
      await nextCommand.run();
    } catch (error: any) {
      Logger.error(`Failed to auto-proceed to ${nextPhase.toUpperCase()} phase: ${error.message}`);
      Logger.info(`Please run manually: flo tdd ${nextPhase}`);
    }
  }
}