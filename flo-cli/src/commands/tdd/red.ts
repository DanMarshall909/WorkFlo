import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { TddStateService } from '../../services/tdd-state';
import { execSync } from 'child_process';
import { Flags } from '@oclif/core';

export default class TddRed extends BaseCommand {
  static override description = 'Write failing test (RED phase)';

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
    const { flags } = await this.parse(TddRed);
    const state = TddStateService.loadState();
    if (!state) {
      this.error('No active TDD session. Run: flo tdd start <issue>');
    }

    Logger.info('🔴 RED Phase - Write failing test');

    this.log('Write a failing test for the current acceptance criteria.');
    this.log('The test should:');
    this.log('  • Cover ONLY the current criteria');
    this.log('  • Use business scenario naming (not \'should\' statements)');
    this.log('  • Follow Given-When-Then structure');
    this.log('');

    // Verify test fails
    Logger.info('Verifying test fails...');
    if (this.runTestsWithSkip()) {
      this.error('Tests are passing! RED phase requires failing tests');
    }

    Logger.success('✅ Tests failing as expected');
    TddStateService.updatePhase('RED');
    
    if (flags.manual) {
      Logger.success('RED phase complete. Next: flo tdd green');
    } else {
      Logger.success('RED phase complete. Auto-proceeding to GREEN phase...');
      // Automatically proceed to GREEN phase
      await this.proceedToNextPhase('green');
    }
  }

  private runTestsWithSkip(): boolean {
    try {
      // Set environment variable to skip script tests, then run tests
      process.env['TDD_SKIP_SCRIPT_TESTS'] = '1';
      execSync('npm test', { stdio: 'ignore' });
      return true; // Tests passed
    } catch {
      return false; // Tests failed (expected in RED phase)
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