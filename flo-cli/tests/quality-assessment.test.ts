import { execSync } from 'child_process';
import * as path from 'path';

const CLI_DIST_PATH = path.join(__dirname, '..', 'dist', 'cli.js');

describe('Quality Assessment System', () => {
  beforeAll(() => {
    // Build the project to ensure dist is up to date
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  });

  describe('AC-1: Implement comprehensive automated quality scoring system', () => {
    it('should have a quality:assess command available', () => {
      // Given: The CLI has been built
      // When: Checking available commands
      const output = execSync(`node ${CLI_DIST_PATH} --help`, { encoding: 'utf8' });
      
      // Then: quality:assess command should be listed
      expect(output).toContain('quality:assess');
      expect(output).toContain('Assess code quality for a pull request');
    });

    it('should assess quality for a given PR number', () => {
      // Given: A PR number
      const prNumber = 123;
      
      // When: Running quality assessment
      const output = execSync(`node ${CLI_DIST_PATH} quality:assess ${prNumber}`, { 
        encoding: 'utf8' 
      });
      
      // Then: Should return a quality report
      expect(output).toContain('Quality Assessment Report');
      expect(output).toContain(`PR #${prNumber}`);
      expect(output).toContain('Overall Score:');
    });

    it('should calculate quality scores across multiple categories', () => {
      // Given: A PR to assess
      const prNumber = 123;
      
      // When: Running quality assessment with JSON output
      const output = execSync(`node ${CLI_DIST_PATH} quality:assess ${prNumber} --json`, { 
        encoding: 'utf8' 
      });
      const report = JSON.parse(output);
      
      // Then: Should have scores for all quality categories
      expect(report).toHaveProperty('overall');
      expect(report).toHaveProperty('categories');
      expect(report.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Code Quality',
            score: expect.any(Number),
            maxScore: 25
          }),
          expect.objectContaining({
            name: 'Test Coverage',
            score: expect.any(Number),
            maxScore: 25
          }),
          expect.objectContaining({
            name: 'Security',
            score: expect.any(Number),
            maxScore: 20
          }),
          expect.objectContaining({
            name: 'Performance',
            score: expect.any(Number),
            maxScore: 15
          }),
          expect.objectContaining({
            name: 'Documentation',
            score: expect.any(Number),
            maxScore: 15
          })
        ])
      );
    });

    it('should provide detailed breakdown for each category', () => {
      // Given: A PR to assess
      const prNumber = 123;
      
      // When: Running quality assessment with verbose output
      const output = execSync(`node ${CLI_DIST_PATH} quality:assess ${prNumber} --verbose`, { 
        encoding: 'utf8' 
      });
      
      // Then: Should show detailed metrics for each category
      expect(output).toContain('Code Quality Details:');
      expect(output).toContain('- Complexity:');
      expect(output).toContain('- Maintainability:');
      expect(output).toContain('- Code Smells:');
      
      expect(output).toContain('Test Coverage Details:');
      expect(output).toContain('- Line Coverage:');
      expect(output).toContain('- Branch Coverage:');
      expect(output).toContain('- Mutation Score:');
    });

    it('should integrate with multiple analysis tools', () => {
      // Given: A PR with various file types
      const prNumber = 123;
      
      // When: Running quality assessment
      const output = execSync(`node ${CLI_DIST_PATH} quality:assess ${prNumber} --show-sources`, { 
        encoding: 'utf8' 
      });
      
      // Then: Should show data from multiple sources
      expect(output).toContain('Data Sources:');
      expect(output).toContain('- ESLint:');
      expect(output).toContain('- Jest Coverage:');
      expect(output).toContain('- TypeScript Compiler:');
      expect(output).toContain('- npm audit:');
    });

    it('should handle missing PR gracefully', () => {
      // Given: A non-existent PR number
      const prNumber = 999999;
      
      // When: Running quality assessment
      // Then: Should provide helpful error message
      expect(() => {
        execSync(`node ${CLI_DIST_PATH} quality:assess ${prNumber}`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
      }).toThrow(/PR #999999 not found/);
    });
  });
});