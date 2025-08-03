import { execSync } from 'child_process';

describe('Auto-TDD Script Migration', () => {
  const CLI_DIST_PATH = 'node dist/cli.js';

  beforeAll(() => {
    // Ensure CLI is built
    execSync('npm run build', { stdio: 'inherit' });
  });

  describe('auto-tdd script functionality migration', () => {
    it('auto_tdd_script_migration_basic_workflow', () => {
      // Given: The auto-tdd script has been migrated to TypeScript
      // When: User tries to run auto workflow commands
      // Then: The commands should be available and functional
      
      // Test that auto commands exist
      const helpOutput = execSync(`${CLI_DIST_PATH} --help`, { encoding: 'utf8' });
      expect(helpOutput).toContain('auto');
      
      // Test auto:status command (equivalent to auto-tdd --status)
      const statusOutput = execSync(`${CLI_DIST_PATH} auto:status`, { encoding: 'utf8' });
      expect(statusOutput).toContain('No active auto workflow running');
    });

    it('auto_tdd_script_migration_command_equivalence', () => {
      // Given: auto-tdd script functionality
      // When: User runs equivalent TypeScript commands
      // Then: Should provide same functionality
      
      // auto-tdd --help equivalent -> auto --help
      const autoHelp = execSync(`${CLI_DIST_PATH} auto --help`, { encoding: 'utf8' });
      expect(autoHelp).toContain('auto:init');
      expect(autoHelp).toContain('auto:run');
      expect(autoHelp).toContain('auto:status');
    });

    it('auto_tdd_script_migration_issue_processing', () => {
      // Given: auto-tdd script can process issues
      // When: User runs auto:run with issue number (equivalent to auto-tdd <issue>)
      // Then: Should handle issue processing
      
      // Test auto:run command with parse-only flag
      expect(() => {
        execSync(`${CLI_DIST_PATH} auto:run 312 --parse-only`, { encoding: 'utf8', stdio: 'pipe' });
      }).not.toThrow();
    });

    it('auto_tdd_script_migration_error_handling', () => {
      // Given: auto-tdd script has error handling
      // When: User provides invalid arguments
      // Then: Should show proper error messages
      
      expect(() => {
        execSync(`${CLI_DIST_PATH} auto:run`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });
  });
});