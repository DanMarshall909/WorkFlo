import { execSync } from 'child_process';
import { GitManager } from '../core/GitManager';
import { GitHubApiException } from '../domain/interfaces';
import { logger } from '../core/Logger';

export interface BoardItem {
  id: string;
  number: number;
  title: string;
  tddPhase: string;
  criteriaProgress: string;
  url: string;
}

export interface BoardInfo {
  id: string;
  title: string;
  url: string;
  itemCount: number;
}

export class BoardManager {
  private readonly boardTitle = 'WorkFlo TDD Board';
  
  constructor(private gitManager: GitManager) {}

  /**
   * Gets or creates the WorkFlo TDD Board
   */
  async getOrCreateBoard(): Promise<string> {
    try {
      const repoOwner = this.gitManager.getRepositoryOwner();
      
      // Check if WorkFlo board exists
      let projectId: string;
      try {
        const listResult = execSync(
          `gh project list --owner "${repoOwner}" --format json`,
          { encoding: 'utf8' }
        );
        
        const projects = JSON.parse(listResult);
        const existingProject = projects.projects?.find((p: any) => p.title === this.boardTitle);
        projectId = existingProject?.id;
      } catch (error) {
        logger.warn('Failed to list existing projects. Attempting to create new board...');
        projectId = '';
      }

      if (!projectId) {
        logger.info('Creating WorkFlo TDD Board...');
        
        const createResult = execSync(
          `gh project create --title "${this.boardTitle}" --owner "${repoOwner}" --format json`,
          { encoding: 'utf8' }
        );
        
        const createdProject = JSON.parse(createResult);
        projectId = createdProject.id;
        
        if (!projectId) {
          throw new GitHubApiException('Project creation returned invalid ID');
        }

        // Add custom fields for TDD tracking
        await this.createCustomFields(projectId);
        
        logger.success(`Created WorkFlo TDD Board (ID: ${projectId})`);
      }

      return projectId;
    } catch (error) {
      throw new GitHubApiException(`Failed to get or create WorkFlo TDD Board: ${error}`);
    }
  }

  /**
   * Adds an issue to the board
   */
  async addToBoard(issueNumber: string): Promise<void> {
    try {
      const projectId = await this.getOrCreateBoard();
      const issueUrl = `$(gh issue view "${issueNumber}" --json url | jq -r '.url')`;
      
      // Add issue to project
      execSync(
        `gh project item-add "${projectId}" --url "${issueUrl}"`,
        { stdio: 'ignore' }
      );

      // Set initial TDD phase
      const itemId = await this.getProjectItemId(projectId, issueNumber);
      if (itemId) {
        await this.setTddPhase(itemId, 'Not Started');
      }
      
      logger.success(`📋 Added issue #${issueNumber} to WorkFlo TDD Board`);
    } catch (error) {
      logger.warn(`Failed to add issue #${issueNumber} to board: ${error}`);
    }
  }

  /**
   * Updates the TDD phase for an issue on the board
   */
  async updateBoardPhase(issueNumber: string, phase: string, criteriaProgress?: string): Promise<void> {
    try {
      const projectId = await this.getOrCreateBoard();
      const itemId = await this.getProjectItemId(projectId, issueNumber);
      
      if (itemId) {
        await this.setTddPhase(itemId, phase);
        
        if (criteriaProgress) {
          await this.setCriteriaProgress(itemId, criteriaProgress);
        }
        
        logger.info(`🔄 Updated board phase for issue #${issueNumber}: ${phase}`);
      }
    } catch (error) {
      logger.warn(`Failed to update board phase for issue #${issueNumber}: ${error}`);
    }
  }

  /**
   * Lists all items on the board
   */
  async listBoard(format: 'human' | 'json' = 'human'): Promise<BoardItem[] | string> {
    try {
      const projectId = await this.getOrCreateBoard();
      
      const listResult = execSync(
        `gh project item-list "${projectId}" --format json`,
        { encoding: 'utf8' }
      );
      
      const projectData = JSON.parse(listResult);
      const items: BoardItem[] = projectData.items
        ?.filter((item: any) => item.content?.type === 'Issue')
        ?.map((item: any) => ({
          id: item.id,
          number: item.content.number,
          title: item.content.title,
          tddPhase: item.fieldValues?.TDD_Phase || 'Not Started',
          criteriaProgress: item.fieldValues?.Criteria_Progress || '',
          url: item.content.url
        })) || [];

      if (format === 'json') {
        return JSON.stringify(items, null, 2);
      }

      return items;
    } catch (error) {
      throw new GitHubApiException(`Failed to list board items: ${error}`);
    }
  }

  /**
   * Displays the board in human-readable format
   */
  async displayBoard(): Promise<void> {
    try {
      const items = await this.listBoard('human') as BoardItem[];
      const boardInfo = await this.getBoardInfo();
      
      console.log('');
      logger.info('WorkFlo TDD Board');
      console.log('=================');
      console.log('');
      
      if (boardInfo.url) {
        console.log(`🔗 Board URL: ${boardInfo.url}`);
        console.log('');
      }

      if (items.length === 0) {
        console.log('📋 No issues found or project access limited');
      } else {
        items.forEach(item => {
          const phaseDisplay = item.tddPhase !== 'Not Started' ? `[${item.tddPhase}]` : '[Not Started]';
          const progressDisplay = item.criteriaProgress ? ` (${item.criteriaProgress})` : '';
          console.log(`📋 Issue ${item.number}: ${item.title} ${phaseDisplay}${progressDisplay}`);
        });
      }

      console.log('');
      logger.info('Use: board show <issue> to see acceptance criteria');
      logger.info('Use: board create to create new issue with criteria');
    } catch (error) {
      logger.warn(`Failed to display board: ${error}`);
    }
  }

  /**
   * Shows details for a specific issue
   */
  async showIssue(issueNumber: string): Promise<void> {
    try {
      const issueData = this.gitManager.getIssueData(issueNumber);
      
      logger.info(`Issue #${issueNumber} Details`);
      console.log('====================');
      console.log('');
      console.log(`📋 Title: ${issueData.title}`);
      console.log(`🏷️  State: ${issueData.state}`);
      console.log('');
      
      // Extract and display acceptance criteria
      const criteria = this.gitManager.getAcceptanceCriteria(issueNumber);
      
      if (criteria.length > 0) {
        logger.info('Acceptance Criteria:');
        criteria.forEach((criterion, index) => {
          console.log(`  ${index + 1}. ${criterion}`);
        });
        
        console.log('');
        logger.info(`Total criteria: ${criteria.length}`);
        console.log('');
        logger.success(`Ready for TDD workflow: ./tdd start ${issueNumber}`);
      } else {
        logger.warn('No acceptance criteria found. Use format: - [ ] criterion');
      }
    } catch (error) {
      throw new GitHubApiException(`Failed to show issue #${issueNumber}: ${error}`);
    }
  }

  /**
   * Marks an issue as complete on the board
   */
  async completeIssue(issueNumber: string): Promise<void> {
    try {
      await this.updateBoardPhase(issueNumber, 'Complete', 'All criteria completed');
      
      // Close the issue
      this.gitManager.closeIssue(issueNumber, 'Completed via TDD workflow');
      
      logger.success(`✅ Issue #${issueNumber} marked as complete`);
      logger.info('Updated on WorkFlo TDD Board');
      
      // Check if this was a subissue and update parent
      const issueData = this.gitManager.getIssueData(issueNumber);
      const parentMatch = issueData.body.match(/Subissue of #(\d+)/);
      
      if (parentMatch) {
        const parentIssue = parentMatch[1];
        logger.info(`Updating parent issue #${parentIssue}`);
        this.gitManager.commentOnIssue(parentIssue, `✅ Completed subissue #${issueNumber}`);
      }
    } catch (error) {
      throw new GitHubApiException(`Failed to complete issue #${issueNumber}: ${error}`);
    }
  }

  /**
   * Gets board information including URL
   */
  async getBoardInfo(): Promise<BoardInfo> {
    try {
      const projectId = await this.getOrCreateBoard();
      const repoOwner = this.gitManager.getRepositoryOwner();
      
      // Extract numeric part from project ID for URL generation
      const projectNumber = projectId.match(/\d+$/)?.[0];
      const url = projectNumber 
        ? `https://github.com/users/${repoOwner}/projects/${projectNumber}`
        : `Project ID ${projectId} (URL generation failed)`;
      
      const items = await this.listBoard('human') as BoardItem[];
      
      return {
        id: projectId,
        title: this.boardTitle,
        url,
        itemCount: items.length
      };
    } catch (error) {
      throw new GitHubApiException(`Failed to get board info: ${error}`);
    }
  }

  /**
   * Gets board status overview
   */
  async getBoardStatus(): Promise<void> {
    try {
      logger.info('Board Status Overview');
      console.log('====================');
      console.log('');
      
      // Count issues by state
      const openCount = execSync('gh issue list --state open --json number | jq ". | length"', { encoding: 'utf8' }).trim();
      const closedCount = execSync('gh issue list --state closed --limit 50 --json number | jq ". | length"', { encoding: 'utf8' }).trim();
      
      console.log(`📊 Issues: ${openCount} open, ${closedCount} recently closed`);
      console.log('');
      
      // Show issues with acceptance criteria
      logger.info('Issues with acceptance criteria (TDD-ready):');
      
      const issuesResult = execSync(
        'gh issue list --state open --json number,title,body | jq -r \'.[] | select(.body | test("- \\\\[ \\\\]")) | "\\(.number): \\(.title)"\' | head -10',
        { encoding: 'utf8' }
      );
      
      const issues = issuesResult.trim().split('\n').filter(line => line);
      
      if (issues.length > 0) {
        issues.forEach(issue => {
          if (issue) {
            console.log(`  📋 Issue ${issue}`);
          }
        });
      } else {
        console.log('  📋 No TDD-ready issues found');
      }
      
      console.log('');
      logger.info('Use: board list - see all issues');
      logger.info('Use: board show <issue> - see issue details');
      logger.info('Use: board create - create new issue');
    } catch (error) {
      logger.warn(`Failed to get board status: ${error}`);
    }
  }

  private async createCustomFields(projectId: string): Promise<void> {
    try {
      // Create TDD Phase field
      execSync(
        `gh project field-create "${projectId}" --name "TDD Phase" --type "single_select" \
         --single-select-option "Not Started" \
         --single-select-option "RED" \
         --single-select-option "GREEN" \
         --single-select-option "REFACTOR" \
         --single-select-option "COVER" \
         --single-select-option "Complete"`,
        { stdio: 'ignore' }
      );
      
      // Create Criteria Progress field
      execSync(
        `gh project field-create "${projectId}" --name "Criteria Progress" --type "text"`,
        { stdio: 'ignore' }
      );
    } catch (error) {
      logger.warn('Failed to create custom fields (continuing anyway)');
    }
  }

  private async getProjectItemId(projectId: string, issueNumber: string): Promise<string | null> {
    try {
      const listResult = execSync(
        `gh project item-list "${projectId}" --format json`,
        { encoding: 'utf8' }
      );
      
      const projectData = JSON.parse(listResult);
      const item = projectData.items?.find((item: any) => 
        item.content?.number === parseInt(issueNumber)
      );
      
      return item?.id || null;
    } catch {
      return null;
    }
  }

  private async setTddPhase(itemId: string, phase: string): Promise<void> {
    try {
      execSync(
        `gh project item-edit --id "${itemId}" --field-id "TDD Phase" --single-select-option-id "${phase}"`,
        { stdio: 'ignore' }
      );
    } catch (error) {
      logger.warn(`Failed to set TDD phase: ${error}`);
    }
  }

  private async setCriteriaProgress(itemId: string, progress: string): Promise<void> {
    try {
      execSync(
        `gh project item-edit --id "${itemId}" --field-id "Criteria Progress" --text "${progress}"`,
        { stdio: 'ignore' }
      );
    } catch (error) {
      logger.warn(`Failed to set criteria progress: ${error}`);
    }
  }
}