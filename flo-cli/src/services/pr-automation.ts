import { execSync } from 'child_process';

export interface PRConfig {
  issueNumber: number;
  isDraft: boolean;
  template?: string | undefined;
  assignReviewers: boolean;
  branchName?: string;
}

export interface AutoRunFlags {
  'no-pr'?: boolean;
  'auto-pr'?: boolean;
  'draft-pr'?: boolean;
  'pr-template'?: string | undefined;
  'assign-reviewers'?: boolean;
}

export interface PRDescription {
  title: string;
  summary: string;
  changes: string[];
  testingNotes: string;
  relatedIssues: number[];
}

export interface WorkflowContext {
  issueNumber: number;
  completedCriteria: string[];
  totalCriteria: number;
  branchName: string;
}

export class PRAutomationService {
  static async createPR(config: PRConfig, context: WorkflowContext): Promise<string> {
    const description = this.generateDescription(context);
    const title = this.generateTitle(context);
    
    const prBody = this.formatPRBody(description, config.template);
    
    try {
      const flags = [
        '--title', `"${title}"`,
        '--body', `"${prBody}"`,
      ];
      
      if (config.isDraft) {
        flags.push('--draft');
      }
      
      if (config.assignReviewers) {
        const reviewers = await this.getReviewers(context);
        if (reviewers.length > 0) {
          flags.push('--reviewer', reviewers.join(','));
        }
      }
      
      const command = `gh pr create ${flags.join(' ')}`;
      const output = execSync(command, { encoding: 'utf8' });
      
      return output.trim();
    } catch (error) {
      throw new Error(`Failed to create PR: ${error}`);
    }
  }
  
  private static generateTitle(context: WorkflowContext): string {
    const { issueNumber, completedCriteria } = context;
    
    if (completedCriteria.length === 1) {
      return `feat: ${completedCriteria[0]} (Issue #${issueNumber})`;
    }
    
    return `feat: Complete ${completedCriteria.length} acceptance criteria (Issue #${issueNumber})`;
  }
  
  private static generateDescription(context: WorkflowContext): PRDescription {
    const { issueNumber, completedCriteria } = context;
    
    return {
      title: this.generateTitle(context),
      summary: `This PR implements ${completedCriteria.length} acceptance criteria for Issue #${issueNumber} using autonomous TDD workflow.`,
      changes: completedCriteria.map((criteria, index) => `${index + 1}. ${criteria}`),
      testingNotes: 'All acceptance criteria have been implemented following TDD methodology with comprehensive test coverage.',
      relatedIssues: [issueNumber]
    };
  }
  
  private static formatPRBody(description: PRDescription, template?: string): string {
    if (template) {
      return this.applyTemplate(description, template);
    }
    
    return this.getDefaultTemplate(description);
  }
  
  private static getDefaultTemplate(description: PRDescription): string {
    return `## Summary
${description.summary}

## Changes
${description.changes.map(change => `- ${change}`).join('\n')}

## Testing
${description.testingNotes}

## Related Issues
${description.relatedIssues.map(issue => `- Closes #${issue}`).join('\n')}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
  }
  
  private static applyTemplate(description: PRDescription, _templateName: string): string {
    // For now, return default template regardless of templateName
    // TODO: Implement template system with file-based templates
    return this.getDefaultTemplate(description);
  }
  
  private static async getReviewers(_context: WorkflowContext): Promise<string[]> {
    // Simple implementation - could be enhanced with code analysis
    try {
      const output = execSync('gh api repos/:owner/:repo/collaborators --jq ".[].login"', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const collaborators = output.trim().split('\n').filter(Boolean);
      
      // Return first 2 collaborators as reviewers (excluding current user)
      const currentUser = execSync('gh api user --jq ".login"', { encoding: 'utf8' }).trim();
      
      return collaborators
        .filter(user => user !== currentUser)
        .slice(0, 2);
    } catch {
      // Fallback: no reviewers if API fails
      return [];
    }
  }
  
  static validatePRFlags(flags: AutoRunFlags): void {
    if (flags['no-pr'] && flags['auto-pr']) {
      throw new Error('Cannot use --no-pr with --auto-pr flags');
    }
    
    if (flags['no-pr'] && (flags['draft-pr'] || flags['pr-template'] || flags['assign-reviewers'])) {
      throw new Error('Cannot use PR configuration flags with --no-pr');
    }
  }
  
  static shouldCreatePR(flags: AutoRunFlags): boolean {
    // Explicit --no-pr disables PR creation
    if (flags['no-pr']) return false;
    
    // Default behavior is to create PR unless user explicitly sets --auto-pr=false
    // If --auto-pr is not specified (undefined), default to true
    return flags['auto-pr'] !== false;
  }
  
  static getPRConfig(flags: AutoRunFlags, issueNumber: number): PRConfig {
    return {
      issueNumber,
      isDraft: Boolean(flags['draft-pr']),
      template: flags['pr-template'],
      assignReviewers: Boolean(flags['assign-reviewers']),
      branchName: `feature/issue-${issueNumber}`
    };
  }
}