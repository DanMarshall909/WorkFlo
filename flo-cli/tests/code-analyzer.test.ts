import { CodeAnalyzer } from '../src/services/code-analyzer';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('CodeAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeChanges', () => {
    it('should analyze modified files correctly', () => {
      mockExecSync.mockReturnValueOnce('M  src/commands/auto/run.ts\n?? docs/new-file.md');
      mockExecSync.mockReturnValueOnce('50\t10\tsrc/commands/auto/run.ts');
      mockExecSync.mockReturnValueOnce('20\t0\tdocs/new-file.md');
      mockExistsSync.mockReturnValue(true);

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.changedFiles).toHaveLength(2);
      expect(analysis.totalLinesAdded).toBe(70);
      expect(analysis.totalLinesRemoved).toBe(10);
      expect(analysis.changeType).toBe('feature');
      expect(analysis.affectedModules).toContain('auto command');
      expect(analysis.affectedModules).toContain('documentation');
    });

    it('should handle empty git status', () => {
      mockExecSync.mockReturnValueOnce('');

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.changedFiles).toHaveLength(0);
      expect(analysis.totalLinesAdded).toBe(0);
      expect(analysis.totalLinesRemoved).toBe(0);
    });

    it('should handle git command errors gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Git not available');
      });

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.changedFiles).toHaveLength(0);
    });
  });

  describe('generatePRDescription', () => {
    it('should generate comprehensive PR description', () => {
      const mockAnalysis = {
        changedFiles: [
          { path: 'src/commands/auto/run.ts', status: 'modified' as const, linesAdded: 50, linesRemoved: 10 },
          { path: 'tests/pr-automation.test.ts', status: 'modified' as const, linesAdded: 20, linesRemoved: 5 },
        ],
        totalLinesAdded: 70,
        totalLinesRemoved: 15,
        changeType: 'feature' as const,
        impactLevel: 'medium' as const,
        affectedModules: ['auto command', 'tests'],
      };

      const prDescription = CodeAnalyzer.generatePRDescription(mockAnalysis, 325);

      expect(prDescription.title).toContain('feat: auto command');
      expect(prDescription.title).toContain('Issue #325');
      expect(prDescription.summary).toContain('feature update');
      expect(prDescription.summary).toContain('2 files');
      expect(prDescription.summary).toContain('+70/-15 lines');
      expect(prDescription.summary).toContain('medium impact');
      expect(prDescription.relatedIssues).toContain(325);
    });

    it('should generate proper changes list', () => {
      const mockAnalysis = {
        changedFiles: [
          { path: 'src/new-service.ts', status: 'added' as const, linesAdded: 100, linesRemoved: 0 },
          { path: 'src/old-service.ts', status: 'deleted' as const, linesAdded: 0, linesRemoved: 50 },
          { path: 'src/commands/test.ts', status: 'modified' as const, linesAdded: 20, linesRemoved: 10 },
        ],
        totalLinesAdded: 120,
        totalLinesRemoved: 60,
        changeType: 'refactor' as const,
        impactLevel: 'high' as const,
        affectedModules: ['test command'],
      };

      const prDescription = CodeAnalyzer.generatePRDescription(mockAnalysis);

      expect(prDescription.changes).toContain('**Added 1 new files:**');
      expect(prDescription.changes).toContain('- src/new-service.ts (+100 lines)');
      expect(prDescription.changes).toContain('**Modified 1 files:**');
      expect(prDescription.changes).toContain('- src/commands/test.ts (+20/-10 lines)');
      expect(prDescription.changes).toContain('**Deleted 1 files:**');
      expect(prDescription.changes).toContain('- src/old-service.ts');
    });

    it('should generate appropriate testing notes', () => {
      const mockAnalysis = {
        changedFiles: [
          { path: 'src/service.ts', status: 'modified' as const, linesAdded: 30, linesRemoved: 5 },
          { path: 'tests/service.test.ts', status: 'modified' as const, linesAdded: 40, linesRemoved: 0 },
        ],
        totalLinesAdded: 70,
        totalLinesRemoved: 5,
        changeType: 'feature' as const,
        impactLevel: 'low' as const,
        affectedModules: ['tests'],
      };

      const prDescription = CodeAnalyzer.generatePRDescription(mockAnalysis);

      expect(prDescription.testingNotes).toContain('1 test files updated');
      expect(prDescription.testingNotes).toContain('npm test');
      expect(prDescription.testingNotes).toContain('Mutation testing included');
    });

    it('should handle no test files', () => {
      const mockAnalysis = {
        changedFiles: [
          { path: 'docs/README.md', status: 'modified' as const, linesAdded: 10, linesRemoved: 2 },
        ],
        totalLinesAdded: 10,
        totalLinesRemoved: 2,
        changeType: 'refactor' as const,
        impactLevel: 'low' as const,
        affectedModules: ['documentation'],
      };

      const prDescription = CodeAnalyzer.generatePRDescription(mockAnalysis);

      expect(prDescription.testingNotes).toContain('No test files modified');
      expect(prDescription.testingNotes).toContain('Existing test suite should continue to pass');
    });
  });

  describe('change type detection', () => {
    it('should detect feature changes for new files', () => {
      mockExecSync.mockReturnValueOnce('A  src/commands/new-feature.ts\nM  tests/new-feature.test.ts');
      mockExecSync.mockReturnValueOnce('100\t0\tsrc/commands/new-feature.ts');
      mockExecSync.mockReturnValueOnce('50\t0\ttests/new-feature.test.ts');

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.changeType).toBe('feature');
    });

    it('should detect refactor for mainly doc changes', () => {
      mockExecSync.mockReturnValueOnce('M  README.md\nM  docs/guide.md\nM  src/util.ts');
      mockExecSync.mockReturnValueOnce('20\t5\tREADME.md');
      mockExecSync.mockReturnValueOnce('30\t10\tdocs/guide.md');
      mockExecSync.mockReturnValueOnce('5\t2\tsrc/util.ts');

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.changeType).toBe('refactor');
    });
  });

  describe('impact level detection', () => {
    it('should detect high impact for many core files', () => {
      mockExecSync.mockReturnValueOnce('M  src/commands/auto/run.ts\nM  src/commands/tdd/start.ts\nM  src/services/logger.ts\nM  src/cli.ts');
      mockExecSync.mockReturnValueOnce('100\t20\tsrc/commands/auto/run.ts');
      mockExecSync.mockReturnValueOnce('50\t10\tsrc/commands/tdd/start.ts');
      mockExecSync.mockReturnValueOnce('30\t5\tsrc/services/logger.ts');
      mockExecSync.mockReturnValueOnce('20\t0\tsrc/cli.ts');

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.impactLevel).toBe('high');
    });

    it('should detect low impact for small changes', () => {
      mockExecSync.mockReturnValueOnce('M  docs/README.md');
      mockExecSync.mockReturnValueOnce('10\t2\tdocs/README.md');

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.impactLevel).toBe('low');
    });

    it('should detect medium impact for moderate changes', () => {
      mockExecSync.mockReturnValueOnce('M  src/commands/test.ts\nM  tests/test.test.ts');
      mockExecSync.mockReturnValueOnce('80\t20\tsrc/commands/test.ts');
      mockExecSync.mockReturnValueOnce('40\t10\ttests/test.test.ts');

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.impactLevel).toBe('medium');
    });
  });

  describe('affected modules detection', () => {
    it('should identify affected command modules', () => {
      mockExecSync.mockReturnValueOnce('M  src/commands/auto/run.ts\nM  src/commands/tdd/start.ts');
      mockExecSync.mockReturnValueOnce('50\t10\tsrc/commands/auto/run.ts');
      mockExecSync.mockReturnValueOnce('30\t5\tsrc/commands/tdd/start.ts');

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.affectedModules).toContain('auto command');
      expect(analysis.affectedModules).toContain('tdd command');
    });

    it('should identify affected service modules', () => {
      mockExecSync.mockReturnValueOnce('M  src/services/logger.ts\nM  src/services/config.ts');
      mockExecSync.mockReturnValueOnce('20\t5\tsrc/services/logger.ts');
      mockExecSync.mockReturnValueOnce('15\t3\tsrc/services/config.ts');

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.affectedModules).toContain('logger service');
      expect(analysis.affectedModules).toContain('config service');
    });

    it('should identify documentation and test modules', () => {
      mockExecSync.mockReturnValueOnce('M  docs/README.md\nM  tests/unit/test.test.ts');
      mockExecSync.mockReturnValueOnce('10\t2\tdocs/README.md');
      mockExecSync.mockReturnValueOnce('20\t0\ttests/unit/test.test.ts');

      const analysis = CodeAnalyzer.analyzeChanges();

      expect(analysis.affectedModules).toContain('documentation');
      expect(analysis.affectedModules).toContain('tests');
    });
  });

  describe('reviewer suggestions', () => {
    it('should suggest automation team for auto command changes', () => {
      const mockAnalysis = {
        changedFiles: [{ path: 'src/commands/auto/run.ts', status: 'modified' as const, linesAdded: 50, linesRemoved: 10 }],
        totalLinesAdded: 50,
        totalLinesRemoved: 10,
        changeType: 'feature' as const,
        impactLevel: 'medium' as const,
        affectedModules: ['auto command'],
      };

      const prDescription = CodeAnalyzer.generatePRDescription(mockAnalysis);

      expect(prDescription.reviewers).toContain('@automation-team');
    });

    it('should suggest senior developers for high impact changes', () => {
      const mockAnalysis = {
        changedFiles: [
          { path: 'src/commands/auto/run.ts', status: 'modified' as const, linesAdded: 200, linesRemoved: 50 },
          { path: 'src/cli.ts', status: 'modified' as const, linesAdded: 100, linesRemoved: 20 },
        ],
        totalLinesAdded: 300,
        totalLinesRemoved: 70,
        changeType: 'feature' as const,
        impactLevel: 'high' as const,
        affectedModules: ['auto command'],
      };

      const prDescription = CodeAnalyzer.generatePRDescription(mockAnalysis);

      expect(prDescription.reviewers).toContain('@senior-developers');
    });
  });
});