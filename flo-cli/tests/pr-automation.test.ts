import { execSync } from 'child_process';
import * as path from 'path';

const CLI_DIST_PATH = path.join(__dirname, '..', 'dist', 'cli.js');

describe('PR automation', () => {
  beforeAll(() => {
    // Build the project to ensure dist is up to date
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  });

  describe('PR automation flags', () => {
    it('shows auto-pr flag in help output', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run --help`, { encoding: 'utf8' });
      expect(output).toContain('--auto-pr');
      expect(output).toContain('Automatically create PR after successful completion');
    });

    it('shows no-pr flag in help output', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run --help`, { encoding: 'utf8' });
      expect(output).toContain('--no-pr');
      expect(output).toContain('Skip PR creation');
    });

    it('shows draft-pr flag in help output', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run --help`, { encoding: 'utf8' });
      expect(output).toContain('--draft-pr');
      expect(output).toContain('Create PR as draft');
    });

    it('shows pr-template flag in help output', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run --help`, { encoding: 'utf8' });
      expect(output).toContain('--pr-template');
      expect(output).toContain('Use specific PR template');
    });

    it('shows assign-reviewers flag in help output', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run --help`, { encoding: 'utf8' });
      expect(output).toContain('--assign-reviewers');
      expect(output).toContain('Auto-assign reviewers based on code changes');
    });
  });

  describe('PR automation validation', () => {
    it('rejects conflicting --no-pr and --auto-pr flags', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --no-pr --auto-pr --parse-only`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
      }).toThrow();
    });

    it('rejects --no-pr with --draft-pr', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --no-pr --draft-pr --parse-only`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
      }).toThrow();
    });

    it('rejects --no-pr with --pr-template', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --no-pr --pr-template custom --parse-only`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
      }).toThrow();
    });

    it('rejects --no-pr with --assign-reviewers', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --no-pr --assign-reviewers --parse-only`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
      }).toThrow();
    });
  });

  describe('PR automation with dry-run', () => {
    it('validates PR automation workflow without execution in dry-run mode', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 324 --criteria 1 --dry-run --auto-pr`, { 
        encoding: 'utf8', 
        stdio: 'pipe'
      });
      expect(output).toContain('Dry-run validation');
      expect(output).toContain('Workflow validated successfully');
      expect(output).not.toContain('Creating Pull Request');
    });

    it('validates PR automation skip in dry-run mode', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 324 --criteria 1 --dry-run --no-pr`, { 
        encoding: 'utf8', 
        stdio: 'pipe'
      });
      expect(output).toContain('Dry-run validation');
      expect(output).toContain('Workflow validated successfully');
      expect(output).not.toContain('Creating Pull Request');
    });
  });

  describe('PR automation integration with execution mode', () => {
    it('shows PR creation message when execute mode completes (simulated)', () => {
      // This test validates the workflow without actually creating PRs
      // In a real scenario, this would create an actual PR
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 324 --criteria 1 --execute --no-pr`, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 10000
      });
      expect(output).toContain('TDD cycle automation finished');
      expect(output).toContain('PR creation skipped');
    });
  });

  describe('PR flag combination handling', () => {
    it('allows --draft-pr with --assign-reviewers', () => {
      expect(() => {
        const output = execSync(`node ${CLI_DIST_PATH} auto:run 324 --criteria 1 --dry-run --draft-pr --assign-reviewers`, { 
          encoding: 'utf8', 
          stdio: 'pipe'
        });
        expect(output).toContain('Workflow validated successfully');
      }).not.toThrow();
    });

    it('allows --pr-template with other PR flags', () => {
      expect(() => {
        const output = execSync(`node ${CLI_DIST_PATH} auto:run 324 --criteria 1 --dry-run --pr-template custom --draft-pr`, { 
          encoding: 'utf8', 
          stdio: 'pipe'
        });
        expect(output).toContain('Workflow validated successfully');
      }).not.toThrow();
    });
  });
});