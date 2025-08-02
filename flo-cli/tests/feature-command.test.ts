import { execSync } from 'child_process';

describe('Feature Command', () => {
  const CLI_DIST_PATH = 'node dist/cli.js';

  beforeAll(() => {
    // Ensure CLI is built
    execSync('npm run build', { stdio: 'inherit' });
  });

  describe('Feature command help', () => {
    it('should show feature command in main help', () => {
      const output = execSync(`${CLI_DIST_PATH} --help`, { encoding: 'utf8' });
      expect(output).toContain('feature');
      expect(output).toContain('Complete end-to-end automated feature development');
    });

    it('should show detailed feature command help', () => {
      const output = execSync(`${CLI_DIST_PATH} feature --help`, { encoding: 'utf8' });
      expect(output).toContain('Complete end-to-end automated feature development');
      expect(output).toContain('USAGE');
      expect(output).toContain('$ flo feature ISSUE');
      expect(output).toContain('ARGUMENTS');
      expect(output).toContain('ISSUE  GitHub issue number');
    });
  });

  describe('Feature command execution', () => {
    it('should execute feature command with valid issue', () => {
      // Use issue #312 which we know exists
      const output = execSync(`${CLI_DIST_PATH} feature 312`, { encoding: 'utf8' });
      
      // Check for expected output patterns from shell script compatibility
      expect(output).toMatch(/Starting automated feature development for issue #312/);
      expect(output).toContain('TDD workflow');
      expect(output).toContain('feature/issue-312');
      expect(output).toContain('PR created');
      expect(output).toContain('90% confident');
      expect(output).toMatch(/Automated feature development completed/);
    });

    it('should handle SIMULATE_ERROR environment variable', () => {
      const output = execSync(`SIMULATE_ERROR=true ${CLI_DIST_PATH} feature 312`, { encoding: 'utf8' });
      
      // Should include all normal output plus error simulation
      expect(output).toContain('TDD workflow');
      expect(output).toContain('feature/issue-312');
      expect(output).toContain('PR created');
      expect(output).toContain('90% confident');
      expect(output).toContain('Reopening subissue'); // Error simulation output
      expect(output).toMatch(/Automated feature development completed/);
    });

    it('should validate issue number exists', () => {
      expect(() => {
        execSync(`${CLI_DIST_PATH} feature 99999`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
      
      // Test the error message pattern
      try {
        execSync(`${CLI_DIST_PATH} feature 99999`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error: any) {
        expect(error.message).toMatch(/Issue #99999 not found/);
      }
    });

    it('should require issue argument', () => {
      expect(() => {
        execSync(`${CLI_DIST_PATH} feature`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
      
      // Should show help when missing required argument
      try {
        execSync(`${CLI_DIST_PATH} feature`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error: any) {
        expect(error.message).toMatch(/showHelp: true/);
      }
    });

    it('should validate issue number format', () => {
      expect(() => {
        execSync(`${CLI_DIST_PATH} feature invalid`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
      
      // Test invalid issue number handling
      try {
        execSync(`${CLI_DIST_PATH} feature invalid`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error: any) {
        expect(error.message).toMatch(/Invalid issue number/);
      }
    });
  });

  describe('Feature command integration', () => {
    it('should be listed in available commands', () => {
      const output = execSync(`${CLI_DIST_PATH} --help`, { encoding: 'utf8' });
      const commandSection = output.split('COMMANDS')[1];
      expect(commandSection).toContain('feature');
    });

    it('should maintain shell script compatibility', () => {
      // Test that TypeScript version produces same key outputs as shell version
      const output = execSync(`${CLI_DIST_PATH} feature 312`, { encoding: 'utf8' });
      
      // These are the exact outputs expected from shell script version
      const expectedOutputs = [
        'TDD workflow',
        'feature/issue-312', 
        'PR created',
        '90% confident'
      ];
      
      expectedOutputs.forEach(expectedOutput => {
        expect(output).toContain(expectedOutput);
      });
    });
  });
});