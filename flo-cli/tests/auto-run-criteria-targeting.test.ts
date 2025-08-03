import { execSync } from 'child_process';
import * as path from 'path';

const CLI_DIST_PATH = path.join(__dirname, '..', 'dist', 'cli.js');

describe('auto:run criteria targeting', () => {
  beforeAll(() => {
    // Build the project to ensure dist is up to date
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  });

  describe('--criteria flag', () => {
    it('processes single criteria when specified', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 312 --criteria 3 --parse-only`, { encoding: 'utf8' });
      expect(output).toContain('acceptance criteria');
    });

    it('processes range of criteria when specified with dash syntax', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 312 --criteria 2-4 --parse-only`, { encoding: 'utf8' });
      expect(output).toContain('acceptance criteria');
    });

    it('rejects invalid criteria number', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --criteria 999 --parse-only`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });

    it('rejects invalid range syntax', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --criteria abc --parse-only`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });
  });

  describe('--from and --to flags', () => {
    it('processes criteria from start index when only --from is specified', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 312 --from 2 --parse-only`, { encoding: 'utf8' });
      expect(output).toContain('acceptance criteria');
    });

    it('processes criteria up to end index when only --to is specified', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 312 --to 3 --parse-only`, { encoding: 'utf8' });
      expect(output).toContain('acceptance criteria');
    });

    it('processes criteria range when both --from and --to are specified', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 312 --from 2 --to 4 --parse-only`, { encoding: 'utf8' });
      expect(output).toContain('acceptance criteria');
    });

    it('rejects invalid from index', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --from 999 --parse-only`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });

    it('rejects invalid to index', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --to 999 --parse-only`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });

    it('rejects when from is greater than to', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --from 4 --to 2 --parse-only`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });
  });

  describe('conflicting flags', () => {
    it('rejects when --criteria is used with --from', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --criteria 3 --from 2 --parse-only`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });

    it('rejects when --criteria is used with --to', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --criteria 3 --to 5 --parse-only`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });

    it('rejects when --criteria is used with both --from and --to', () => {
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} auto:run 312 --criteria 3 --from 2 --to 5 --parse-only`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });
  });

  describe('JSON output with targeting', () => {
    it('includes targeting information in JSON output', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 312 --criteria 2-4 --parse-only --json`, { encoding: 'utf8' });
      const result = JSON.parse(output);
      expect(result).toHaveProperty('targeting');
      expect(result.targeting).toHaveProperty('indices');
      expect(result.targeting).toHaveProperty('range');
      expect(result.targeting.range).toBe('2-4');
    });

    it('shows null targeting when no targeting specified', () => {
      const output = execSync(`node ${CLI_DIST_PATH} auto:run 312 --parse-only --json`, { encoding: 'utf8' });
      const result = JSON.parse(output);
      expect(result.targeting).toBeNull();
    });
  });
});