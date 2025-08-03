import { execSync } from 'child_process';
import * as path from 'path';

const CLI_DIST_PATH = path.join(__dirname, '..', 'dist', 'cli.js');

describe('TDD cycle automation orchestration', () => {
  beforeAll(() => {
    // Build the project to ensure dist is up to date
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  });

  describe('full autonomous TDD execution', () => {
    it('executes complete TDD cycle when auto:run called without parse-only flag', () => {
      // Given: An issue with acceptance criteria exists
      // When: User runs auto:run without --parse-only flag
      // Then: Should execute full TDD cycle automation
      
      // This test fails because auto:run currently only plans, doesn't execute
      expect(() => {
        const output = execSync(`node ${CLI_DIST_PATH} auto:run 324 --criteria 1 --execute`, { 
          encoding: 'utf8', 
          stdio: 'pipe',
          timeout: 5000
        });
        expect(output).toContain('Starting TDD execution');
        expect(output).toContain('RED phase completed');
        expect(output).toContain('GREEN phase completed');
      }).not.toThrow();
    });

    it('provides progress updates during TDD cycle execution', () => {
      // Given: Auto workflow is executing
      // When: User requests progress monitoring
      // Then: Should show real-time phase transitions
      
      expect(() => {
        const output = execSync(`node ${CLI_DIST_PATH} auto:run 324 --criteria 1 --monitor`, { 
          encoding: 'utf8', 
          stdio: 'pipe',
          timeout: 5000
        });
        expect(output).toMatch(/Phase:\s+(RED|GREEN|REFACTOR|COVER)/);
        expect(output).toMatch(/Progress:\s+\d+%/);
      }).not.toThrow();
    });

    it('handles execution errors gracefully with recovery options', () => {
      // Given: TDD execution encounters an error
      // When: Auto workflow processes the error
      // Then: Should provide recovery mechanisms
      
      expect(() => {
        const output = execSync(`node ${CLI_DIST_PATH} auto:run 999 --criteria 1 --execute`, { 
          encoding: 'utf8', 
          stdio: 'pipe',
          timeout: 5000
        });
        expect(output).toMatch(/Error recovery options/);
        expect(output).toMatch(/retry|rollback|continue/i);
      }).toThrow(); // Should throw but provide recovery info
    });
  });

  describe('dry-run mode validation', () => {
    it('validates workflow without execution in dry-run mode', () => {
      // Given: User wants to validate workflow plan
      // When: User runs auto:run with --dry-run flag
      // Then: Should validate without executing
      
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 324 --criteria 1 --dry-run`, { 
        encoding: 'utf8', 
        stdio: 'pipe'
      });
      expect(output).toContain('Dry-run validation');
      expect(output).toContain('Workflow validated successfully');
      expect(output).not.toContain('Executing');
    });
  });
});