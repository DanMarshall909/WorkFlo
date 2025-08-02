import { BaseCommand } from '../../base-command';
import { Logger } from '../../services/logger';
import { TddStateService } from '../../services/tdd-state';
import { execSync } from 'child_process';

export default class TddRefactor extends BaseCommand {
  static description = 'Improve code quality (REFACTOR phase)';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    const state = TddStateService.loadState();
    if (!state) {
      this.error('No active TDD session');
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
    Logger.success('REFACTOR phase complete. Next: flo tdd cover');
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
      process.env.TDD_SKIP_SCRIPT_TESTS = '1';
      execSync('./run-tests', { stdio: 'ignore' });
      return true; // Tests passed
    } catch {
      return false; // Tests failed
    } finally {
      delete process.env.TDD_SKIP_SCRIPT_TESTS;
    }
  }
}