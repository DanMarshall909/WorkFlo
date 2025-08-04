import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  complexity?: number;
}

export interface CodeAnalysis {
  changedFiles: FileChange[];
  totalLinesAdded: number;
  totalLinesRemoved: number;
  changeType: 'feature' | 'bugfix' | 'refactor' | 'hotfix' | 'mixed';
  impactLevel: 'low' | 'medium' | 'high';
  testCoverageChange?: number;
  affectedModules: string[];
}

export interface PRDescription {
  title: string;
  summary: string;
  changes: string[];
  testingNotes: string;
  relatedIssues: number[];
  reviewers: string[];
}

export class CodeAnalyzer {
  static analyzeChanges(): CodeAnalysis {
    const changedFiles = this.getChangedFiles();
    const totalLinesAdded = changedFiles.reduce((sum, file) => sum + file.linesAdded, 0);
    const totalLinesRemoved = changedFiles.reduce((sum, file) => sum + file.linesRemoved, 0);
    
    return {
      changedFiles,
      totalLinesAdded,
      totalLinesRemoved,
      changeType: this.determineChangeType(changedFiles),
      impactLevel: this.determineImpactLevel(changedFiles, totalLinesAdded + totalLinesRemoved),
      affectedModules: this.getAffectedModules(changedFiles),
    };
  }

  static generatePRDescription(analysis: CodeAnalysis, issueNumber?: number): PRDescription {
    const title = this.generateTitle(analysis, issueNumber);
    const summary = this.generateSummary(analysis);
    const changes = this.generateChangesList(analysis);
    const testingNotes = this.generateTestingNotes(analysis);
    const relatedIssues = issueNumber ? [issueNumber] : [];
    const reviewers = this.suggestReviewers(analysis);

    return {
      title,
      summary,
      changes,
      testingNotes,
      relatedIssues,
      reviewers,
    };
  }

  private static getChangedFiles(): FileChange[] {
    try {
      const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
      const lines = statusOutput.trim().split('\n').filter(line => line.length > 0);
      
      return lines.map(line => {
        const status = line.substring(0, 2).trim();
        const path = line.substring(3);
        
        const gitStatus = status.includes('M') ? 'modified' : 
                         status.includes('A') ? 'added' : 
                         status.includes('D') ? 'deleted' : 'modified';

        const { linesAdded, linesRemoved } = this.getFileChangeStats(path, gitStatus);

        return {
          path,
          status: gitStatus,
          linesAdded,
          linesRemoved,
        };
      });
    } catch {
      console.warn('Could not get changed files');
      return [];
    }
  }

  private static getFileChangeStats(filePath: string, status: string): { linesAdded: number; linesRemoved: number } {
    if (status === 'deleted') {
      return { linesAdded: 0, linesRemoved: 0 };
    }

    try {
      const diffOutput = execSync(`git diff --numstat HEAD -- "${filePath}"`, { encoding: 'utf8' });
      const parts = diffOutput.trim().split('\t');
      const added = parseInt(parts[0] || '0') || 0;
      const removed = parseInt(parts[1] || '0') || 0;
      return { linesAdded: added, linesRemoved: removed };
    } catch {
      // For new files or untracked files, count total lines
      if (status === 'added' && existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf8');
          const lines = content.split('\n').length;
          return { linesAdded: lines, linesRemoved: 0 };
        } catch {
          return { linesAdded: 0, linesRemoved: 0 };
        }
      }
      return { linesAdded: 0, linesRemoved: 0 };
    }
  }

  private static determineChangeType(changedFiles: FileChange[]): 'feature' | 'bugfix' | 'refactor' | 'hotfix' | 'mixed' {
    const srcFiles = changedFiles.filter(f => f.path.includes('src/') && !f.path.includes('.test.') && !f.path.includes('.spec.'));
    const docFiles = changedFiles.filter(f => f.path.includes('docs/') || f.path.includes('.md'));

    // If mainly documentation changes
    if (docFiles.length > srcFiles.length) {
      return 'refactor';
    }

    // If new features (new source files)
    const newFiles = changedFiles.filter(f => f.status === 'added' && f.path.includes('src/'));
    if (newFiles.length > 0) {
      return 'feature';
    }

    // Default to feature for mixed changes
    return 'feature';
  }

  private static determineImpactLevel(changedFiles: FileChange[], totalLines: number): 'low' | 'medium' | 'high' {
    const coreFiles = changedFiles.filter(f => 
      f.path.includes('src/commands/') || 
      f.path.includes('src/services/') ||
      f.path.includes('cli.ts')
    );

    if (coreFiles.length > 3 || totalLines > 500) {
      return 'high';
    }
    
    if (coreFiles.length > 1 || totalLines > 100) {
      return 'medium';
    }

    return 'low';
  }

  private static getAffectedModules(changedFiles: FileChange[]): string[] {
    const modules = new Set<string>();
    
    changedFiles.forEach(file => {
      if (file.path.includes('src/commands/')) {
        const parts = file.path.split('/');
        const commandName = parts[2];
        if (commandName) {
          modules.add(`${commandName} command`);
        }
      } else if (file.path.includes('src/services/')) {
        const parts = file.path.split('/');
        const serviceName = parts[2]?.replace('.ts', '');
        if (serviceName) {
          modules.add(`${serviceName} service`);
        }
      } else if (file.path.includes('docs/')) {
        modules.add('documentation');
      } else if (file.path.includes('tests/')) {
        modules.add('tests');
      }
    });

    return Array.from(modules);
  }

  private static generateTitle(analysis: CodeAnalysis, issueNumber?: number): string {
    const changeTypeMap = {
      feature: 'feat',
      bugfix: 'fix', 
      refactor: 'refactor',
      hotfix: 'hotfix',
      mixed: 'feat'
    };

    const prefix = changeTypeMap[analysis.changeType];
    const mainModule = analysis.affectedModules[0] || 'system';
    const issueRef = issueNumber ? ` (Issue #${issueNumber})` : '';

    return `${prefix}: ${mainModule} enhancements${issueRef}`;
  }

  private static generateSummary(analysis: CodeAnalysis): string {
    const { changedFiles, totalLinesAdded, totalLinesRemoved, changeType, impactLevel } = analysis;
    
    let summary = `## Summary\n\n`;
    summary += `This ${changeType} update modifies ${changedFiles.length} files `;
    summary += `(+${totalLinesAdded}/-${totalLinesRemoved} lines) with ${impactLevel} impact.\n\n`;
    
    if (analysis.affectedModules.length > 0) {
      summary += `**Affected modules**: ${analysis.affectedModules.join(', ')}\n\n`;
    }

    return summary;
  }

  private static generateChangesList(analysis: CodeAnalysis): string[] {
    const changes: string[] = [];
    const { changedFiles } = analysis;

    // Group changes by type
    const added = changedFiles.filter(f => f.status === 'added');
    const modified = changedFiles.filter(f => f.status === 'modified');
    const deleted = changedFiles.filter(f => f.status === 'deleted');

    if (added.length > 0) {
      changes.push(`**Added ${added.length} new files:**`);
      added.forEach(f => changes.push(`- ${f.path} (+${f.linesAdded} lines)`));
    }

    if (modified.length > 0) {
      changes.push(`**Modified ${modified.length} files:**`);
      modified.forEach(f => changes.push(`- ${f.path} (+${f.linesAdded}/-${f.linesRemoved} lines)`));
    }

    if (deleted.length > 0) {
      changes.push(`**Deleted ${deleted.length} files:**`);
      deleted.forEach(f => changes.push(`- ${f.path}`));
    }

    return changes;
  }

  private static generateTestingNotes(analysis: CodeAnalysis): string {
    let notes = `## Testing\n\n`;
    
    const testFiles = analysis.changedFiles.filter(f => 
      f.path.includes('.test.') || f.path.includes('.spec.')
    );

    if (testFiles.length > 0) {
      notes += `- ${testFiles.length} test files updated\n`;
      notes += `- Run \`npm test\` to verify all tests pass\n`;
      notes += `- Mutation testing included in quality checks\n`;
    } else {
      notes += `- No test files modified in this change\n`;
      notes += `- Existing test suite should continue to pass\n`;
    }

    notes += `- Quality checks include: build, unit tests, mutation testing\n`;
    notes += `- All quality gates must pass before merge\n`;

    return notes;
  }

  private static suggestReviewers(analysis: CodeAnalysis): string[] {
    const reviewers: string[] = [];
    
    // Suggest reviewers based on affected modules
    if (analysis.affectedModules.includes('auto command')) {
      reviewers.push('@automation-team');
    }
    if (analysis.affectedModules.includes('tdd command')) {
      reviewers.push('@tdd-team');
    }
    if (analysis.affectedModules.includes('documentation')) {
      reviewers.push('@docs-team');
    }
    if (analysis.impactLevel === 'high') {
      reviewers.push('@senior-developers');
    }

    return reviewers;
  }
}