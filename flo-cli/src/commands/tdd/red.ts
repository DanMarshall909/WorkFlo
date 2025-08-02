import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { TddStateService } from '../../services/tdd-state';
import { execSync } from 'child_process';

export default class TddRed extends BaseCommand {
  static override description = 'Write failing test (RED phase)';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  override async run(): Promise<void> {
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
    Logger.success('RED phase complete. Next: flo tdd green');
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
}