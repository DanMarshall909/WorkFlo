import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { TddStateService } from '../../services/tdd-state';
import { execSync } from 'child_process';

export default class TddGreen extends BaseCommand {
  static override description = 'Minimal implementation (GREEN phase)';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  override async run(): Promise<void> {
    const state = TddStateService.loadState();
    if (!state) {
      this.error('No active TDD session');
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
      this.error('Tests still failing! GREEN phase requires passing tests');
    }

    Logger.success('✅ All tests passing');
    TddStateService.updatePhase('GREEN');
    Logger.success('GREEN phase complete. Next: flo tdd refactor OR flo tdd cover');
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
}