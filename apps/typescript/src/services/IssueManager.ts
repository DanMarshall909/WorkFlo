import { GitManager, IssueData } from '../core/GitManager';
import { GitHubApiException } from '../domain/interfaces';
import { Logger } from "../core/logger";

export interface CreateIssueOptions {
  title: string;
  body: string;
  labels?: string[];
}

export interface AcceptanceCriteria {
  text: string;
  completed: boolean;
  index: number;
}

export class IssueManager {
  constructor(private gitManager: GitManager) {}

  /**
   * Creates a new GitHub issue with acceptance criteria
   */
  async createIssue(options: CreateIssueOptions): Promise<number> {
    try {
      return this.gitManager.createIssue(options.title, options.body, options.labels);
    } catch (error) {
      throw new GitHubApiException(`Failed to create issue: ${error}`);
    }
  }

  /**
   * Creates an issue with formatted acceptance criteria
   */  
  async createIssueWithCriteria(title: string, criteria: string[], description?: string): Promise<number> {
    const body = this.formatIssueBody(description || '', criteria);
    
    return this.createIssue({
      title,
      body,
      labels: ['tdd-ready']
    });
  }

  /**
   * Gets issue data with validation
   */
  async getIssue(issueNumber: string): Promise<IssueData> {
    if (!this.gitManager.issueExists(issueNumber)) {
      throw new GitHubApiException(`Issue #${issueNumber} not found`);
    }

    try {
      return this.gitManager.getIssueData(issueNumber);
    } catch (error) {
      throw new GitHubApiException(`Failed to get issue #${issueNumber}: ${error}`);
    }
  }

  /**
   * Gets all acceptance criteria from an issue
   */
  async getAcceptanceCriteria(issueNumber: string): Promise<AcceptanceCriteria[]> {
    const criteria = this.gitManager.getAcceptanceCriteria(issueNumber);
    
    return criteria.map((text, index) => ({
      text,
      completed: false, // We don't track completion in the issue body format
      index: index + 1
    }));
  }

  /**
   * Gets a specific acceptance criteria by index
   */
  async getCriteriaText(issueNumber: string, criteriaIndex: number): Promise<string> {
    const text = this.gitManager.getCriteriaText(issueNumber, criteriaIndex);
    
    if (!text) {
      throw new GitHubApiException(`No acceptance criteria found at position ${criteriaIndex} for issue #${issueNumber}`);
    }
    
    return text;
  }

  /**
   * Counts the total number of acceptance criteria in an issue
   */
  async countCriteria(issueNumber: string): Promise<number> {
    const count = this.gitManager.countAcceptanceCriteria(issueNumber);
    
    if (count === 0) {
      throw new GitHubApiException(`No acceptance criteria found in issue #${issueNumber}. Use format: - [ ] criterion`);
    }
    
    return count;
  }

  /**
   * Validates that an issue has proper acceptance criteria format
   */
  async validateIssueFormat(issueNumber: string): Promise<boolean> {
    try {
      const issueData = await this.getIssue(issueNumber);
      const criteriaPattern = /^- \[ \]/gm;
      const matches = issueData.body.match(criteriaPattern);
      
      return matches !== null && matches.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Creates a subissue linked to a parent issue
   */
  async createSubissue(parentIssue: string, title: string, criteria: string[], description?: string): Promise<number> {
    const parentData = await this.getIssue(parentIssue);
    const subissueTitle = `[${parentIssue}] ${title}`;
    
    const body = `Subissue of #${parentIssue}

${description || ''}

## Parent Issue
**${parentData.title}**

## Acceptance Criteria

${criteria.map(c => `- [ ] ${c}`).join('\n')}

## Linked to
- Parent Issue: #${parentIssue}
- TDD Phase: START

This is a subissue created automatically by WorkFlo TDD workflow.`;

    const subissueNumber = await this.createIssue({
      title: subissueTitle,
      body,
      labels: ['subissue', 'tdd-ready']
    });

    // Add comment to parent issue
    try {
      this.gitManager.commentOnIssue(parentIssue, `Created subissue #${subissueNumber}: ${title}`);
    } catch (error) {
      logger.warn(`Failed to comment on parent issue #${parentIssue}`);
    }

    return subissueNumber;
  }

  /**
   * Creates a test subissue for TDD phases (RED or COVER)
   */
  async createTestSubissue(parentIssue: string, phase: 'RED' | 'COVER', criteriaText: string, criteriaNum: number): Promise<number> {
    const phaseMap = {
      'RED': {
        title: `Test: Add failing test for criteria ${criteriaNum}`,
        description: 'Add failing test for acceptance criteria',
        guidelines: [
          'Test covers ONLY this specific criteria',
          'Uses business scenario naming (not \'should\' statements)',
          'Follows Given-When-Then structure',
          'Test fails initially (RED phase requirement)'
        ]
      },
      'COVER': {
        title: `Test: Add comprehensive coverage for criteria ${criteriaNum}`,
        description: 'Add comprehensive test coverage for acceptance criteria',
        guidelines: [
          'Edge cases and boundary conditions',
          'Error scenarios and exception handling',
          'Different input variations',
          'Mutation testing score ≥ 85%'
        ]
      }
    };

    const config = phaseMap[phase];
    const body = `## Test Requirement

${config.description} ${criteriaNum}:
> ${criteriaText}

### Test Guidelines
${config.guidelines.map(g => `- [ ] ${g}`).join('\n')}

### Linked to
- Parent Issue: #${parentIssue}
- TDD Phase: ${phase}
- Criteria: ${criteriaNum}/total

This is a test subissue created automatically by WorkFlo TDD workflow.`;

    try {
      const subissueNumber = await this.createIssue({
        title: config.title,
        body,
        labels: ['test', 'subissue', 'tdd-ready']
      });

      // Link subissue to parent issue
      this.gitManager.commentOnIssue(parentIssue, `Related test subissue created: #${subissueNumber}`);
      
      logger.success(`📝 Created test subissue: #${subissueNumber}`);
      return subissueNumber;
    } catch (error) {
      logger.warn('Failed to create test subissue (continuing anyway)');
      return 0;
    }
  }

  /**
   * Closes an issue with optional comment
   */
  async closeIssue(issueNumber: string, comment?: string): Promise<void> {
    try {
      this.gitManager.closeIssue(issueNumber, comment);
      logger.success(`✅ Closed issue #${issueNumber}`);
    } catch (error) {
      throw new GitHubApiException(`Failed to close issue #${issueNumber}: ${error}`);
    }
  }

  /**
   * Adds a comment to an issue
   */
  async commentOnIssue(issueNumber: string, comment: string): Promise<void> {
    try {
      this.gitManager.commentOnIssue(issueNumber, comment);
    } catch (error) {
      logger.warn(`Failed to comment on issue #${issueNumber}`);
    }
  }

  /**
   * Gets issue title for display purposes
   */
  async getIssueTitle(issueNumber: string): Promise<string> {
    try {
      const issueData = await this.getIssue(issueNumber);
      return issueData.title;
    } catch {
      return `Issue ${issueNumber}`;
    }
  }

  /**
   * Formats issue body with description and acceptance criteria
   */
  private formatIssueBody(description: string, criteria: string[]): string {
    let body = description;
    
    if (description) {
      body += '\n\n';
    }
    
    body += '## Acceptance Criteria\n\n';
    body += criteria.map(criterion => `- [ ] ${criterion}`).join('\n');
    
    return body;
  }

  /**
   * Checks if an issue is a subissue
   */
  async isSubissue(issueNumber: string): Promise<boolean> {
    try {
      const issueData = await this.getIssue(issueNumber);
      return issueData.body.includes('Subissue of #') || issueData.title.includes('[');
    } catch {
      return false;
    }
  }

  /**
   * Gets the parent issue number if this is a subissue
   */
  async getParentIssue(issueNumber: string): Promise<string | null> {
    try {
      const issueData = await this.getIssue(issueNumber);
      const match = issueData.body.match(/Subissue of #(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}