import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { TddStateService } from '../../services/tdd-state';
import { execSync } from 'child_process';
import { Flags } from '@oclif/core';

export default class TddGreen extends BaseCommand {
  static override description = 'Minimal implementation (GREEN phase)';

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
    const { flags } = await this.parse(TddGreen);
    const state = TddStateService.loadState();
    if (!state) {
      this.error('No active TDD session');
    }

    // Check if we're running out of sequence
    if (state.phase !== 'RED') {
      Logger.warn(`⚠️  AI AGENT HINT: Current phase is ${state.phase}, but GREEN phase should follow RED phase`);
      Logger.warn('💡 TDD workflow should be: RED → GREEN → REFACTOR → COVER → NEXT');
      Logger.warn('🤖 If you manually implemented changes, consider updating the TDD state appropriately');
      this.log('');
    }

    Logger.info('🟢 GREEN Phase - Minimal implementation');

    this.log('Implement the MINIMAL code needed to make the test pass.');
    this.log('Requirements:');
    this.log('  • Simplest possible solution');
    this.log('  • No extra features or optimizations');
    this.log('  • Just enough to make the test green');
    this.log('');

    // Verify tests pass
    Logger.info('Verifying tests pass...');
    if (!this.runTestsWithSkip()) {
      Logger.error('Tests still failing! GREEN phase requires passing tests');
      Logger.warn('💡 AI AGENT HINT: If you manually implemented code, ensure all tests pass before running TDD commands');
      Logger.warn('🔧 Debug: Run "npm test" to see which tests are failing');
      this.error('Tests still failing! GREEN phase requires passing tests');
    }

    Logger.success('✅ All tests passing');
    TddStateService.updatePhase('GREEN');
    
    if (flags.manual) {
      Logger.success('GREEN phase complete. Next: flo tdd refactor OR flo tdd cover');
    } else {
      Logger.success('GREEN phase complete. Auto-proceeding to REFACTOR phase...');
      // Automatically proceed to REFACTOR phase
      await this.proceedToNextPhase('refactor');
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