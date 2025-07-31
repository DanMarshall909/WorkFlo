"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardManager = void 0;
const child_process_1 = require("child_process");
const interfaces_1 = require("../domain/interfaces");
class BoardManager {
    constructor(gitManager) {
        this.gitManager = gitManager;
        this.boardTitle = 'WorkFlo TDD Board';
    }
    /**
     * Gets or creates the WorkFlo TDD Board
     */
    getOrCreateBoard() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const repoOwner = this.gitManager.getRepositoryOwner();
                // Check if WorkFlo board exists
                let projectId;
                try {
                    const listResult = (0, child_process_1.execSync)(`gh project list --owner "${repoOwner}" --format json`, { encoding: 'utf8' });
                    const projects = JSON.parse(listResult);
                    const existingProject = (_a = projects.projects) === null || _a === void 0 ? void 0 : _a.find((p) => p.title === this.boardTitle);
                    projectId = existingProject === null || existingProject === void 0 ? void 0 : existingProject.id;
                }
                catch (error) {
                    logger.warn('Failed to list existing projects. Attempting to create new board...');
                    projectId = '';
                }
                if (!projectId) {
                    logger.info('Creating WorkFlo TDD Board...');
                    const createResult = (0, child_process_1.execSync)(`gh project create --title "${this.boardTitle}" --owner "${repoOwner}" --format json`, { encoding: 'utf8' });
                    const createdProject = JSON.parse(createResult);
                    projectId = createdProject.id;
                    if (!projectId) {
                        throw new interfaces_1.GitHubApiException('Project creation returned invalid ID');
                    }
                    // Add custom fields for TDD tracking
                    yield this.createCustomFields(projectId);
                    logger.success(`Created WorkFlo TDD Board (ID: ${projectId})`);
                }
                return projectId;
            }
            catch (error) {
                throw new interfaces_1.GitHubApiException(`Failed to get or create WorkFlo TDD Board: ${error}`);
            }
        });
    }
    /**
     * Adds an issue to the board
     */
    addToBoard(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const projectId = yield this.getOrCreateBoard();
                const issueUrl = `$(gh issue view "${issueNumber}" --json url | jq -r '.url')`;
                // Add issue to project
                (0, child_process_1.execSync)(`gh project item-add "${projectId}" --url "${issueUrl}"`, { stdio: 'ignore' });
                // Set initial TDD phase
                const itemId = yield this.getProjectItemId(projectId, issueNumber);
                if (itemId) {
                    yield this.setTddPhase(itemId, 'Not Started');
                }
                logger.success(`📋 Added issue #${issueNumber} to WorkFlo TDD Board`);
            }
            catch (error) {
                logger.warn(`Failed to add issue #${issueNumber} to board: ${error}`);
            }
        });
    }
    /**
     * Updates the TDD phase for an issue on the board
     */
    updateBoardPhase(issueNumber, phase, criteriaProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const projectId = yield this.getOrCreateBoard();
                const itemId = yield this.getProjectItemId(projectId, issueNumber);
                if (itemId) {
                    yield this.setTddPhase(itemId, phase);
                    if (criteriaProgress) {
                        yield this.setCriteriaProgress(itemId, criteriaProgress);
                    }
                    logger.info(`🔄 Updated board phase for issue #${issueNumber}: ${phase}`);
                }
            }
            catch (error) {
                logger.warn(`Failed to update board phase for issue #${issueNumber}: ${error}`);
            }
        });
    }
    /**
     * Lists all items on the board
     */
    listBoard() {
        return __awaiter(this, arguments, void 0, function* (format = 'human') {
            var _a, _b;
            try {
                const projectId = yield this.getOrCreateBoard();
                const listResult = (0, child_process_1.execSync)(`gh project item-list "${projectId}" --format json`, { encoding: 'utf8' });
                const projectData = JSON.parse(listResult);
                const items = ((_b = (_a = projectData.items) === null || _a === void 0 ? void 0 : _a.filter((item) => { var _a; return ((_a = item.content) === null || _a === void 0 ? void 0 : _a.type) === 'Issue'; })) === null || _b === void 0 ? void 0 : _b.map((item) => {
                    var _a, _b;
                    return ({
                        id: item.id,
                        number: item.content.number,
                        title: item.content.title,
                        tddPhase: ((_a = item.fieldValues) === null || _a === void 0 ? void 0 : _a.TDD_Phase) || 'Not Started',
                        criteriaProgress: ((_b = item.fieldValues) === null || _b === void 0 ? void 0 : _b.Criteria_Progress) || '',
                        url: item.content.url
                    });
                })) || [];
                if (format === 'json') {
                    return JSON.stringify(items, null, 2);
                }
                return items;
            }
            catch (error) {
                throw new interfaces_1.GitHubApiException(`Failed to list board items: ${error}`);
            }
        });
    }
    /**
     * Displays the board in human-readable format
     */
    displayBoard() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const items = yield this.listBoard('human');
                const boardInfo = yield this.getBoardInfo();
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
                }
                else {
                    items.forEach(item => {
                        const phaseDisplay = item.tddPhase !== 'Not Started' ? `[${item.tddPhase}]` : '[Not Started]';
                        const progressDisplay = item.criteriaProgress ? ` (${item.criteriaProgress})` : '';
                        console.log(`📋 Issue ${item.number}: ${item.title} ${phaseDisplay}${progressDisplay}`);
                    });
                }
                console.log('');
                logger.info('Use: board show <issue> to see acceptance criteria');
                logger.info('Use: board create to create new issue with criteria');
            }
            catch (error) {
                logger.warn(`Failed to display board: ${error}`);
            }
        });
    }
    /**
     * Shows details for a specific issue
     */
    showIssue(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
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
                }
                else {
                    logger.warn('No acceptance criteria found. Use format: - [ ] criterion');
                }
            }
            catch (error) {
                throw new interfaces_1.GitHubApiException(`Failed to show issue #${issueNumber}: ${error}`);
            }
        });
    }
    /**
     * Marks an issue as complete on the board
     */
    completeIssue(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.updateBoardPhase(issueNumber, 'Complete', 'All criteria completed');
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
            }
            catch (error) {
                throw new interfaces_1.GitHubApiException(`Failed to complete issue #${issueNumber}: ${error}`);
            }
        });
    }
    /**
     * Gets board information including URL
     */
    getBoardInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const projectId = yield this.getOrCreateBoard();
                const repoOwner = this.gitManager.getRepositoryOwner();
                // Extract numeric part from project ID for URL generation
                const projectNumber = (_a = projectId.match(/\d+$/)) === null || _a === void 0 ? void 0 : _a[0];
                const url = projectNumber
                    ? `https://github.com/users/${repoOwner}/projects/${projectNumber}`
                    : `Project ID ${projectId} (URL generation failed)`;
                const items = yield this.listBoard('human');
                return {
                    id: projectId,
                    title: this.boardTitle,
                    url,
                    itemCount: items.length
                };
            }
            catch (error) {
                throw new interfaces_1.GitHubApiException(`Failed to get board info: ${error}`);
            }
        });
    }
    /**
     * Gets board status overview
     */
    getBoardStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger.info('Board Status Overview');
                console.log('====================');
                console.log('');
                // Count issues by state
                const openCount = (0, child_process_1.execSync)('gh issue list --state open --json number | jq ". | length"', { encoding: 'utf8' }).trim();
                const closedCount = (0, child_process_1.execSync)('gh issue list --state closed --limit 50 --json number | jq ". | length"', { encoding: 'utf8' }).trim();
                console.log(`📊 Issues: ${openCount} open, ${closedCount} recently closed`);
                console.log('');
                // Show issues with acceptance criteria
                logger.info('Issues with acceptance criteria (TDD-ready):');
                const issuesResult = (0, child_process_1.execSync)('gh issue list --state open --json number,title,body | jq -r \'.[] | select(.body | test("- \\\\[ \\\\]")) | "\\(.number): \\(.title)"\' | head -10', { encoding: 'utf8' });
                const issues = issuesResult.trim().split('\n').filter(line => line);
                if (issues.length > 0) {
                    issues.forEach(issue => {
                        if (issue) {
                            console.log(`  📋 Issue ${issue}`);
                        }
                    });
                }
                else {
                    console.log('  📋 No TDD-ready issues found');
                }
                console.log('');
                logger.info('Use: board list - see all issues');
                logger.info('Use: board show <issue> - see issue details');
                logger.info('Use: board create - create new issue');
            }
            catch (error) {
                logger.warn(`Failed to get board status: ${error}`);
            }
        });
    }
    createCustomFields(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create TDD Phase field
                (0, child_process_1.execSync)(`gh project field-create "${projectId}" --name "TDD Phase" --type "single_select" \
         --single-select-option "Not Started" \
         --single-select-option "RED" \
         --single-select-option "GREEN" \
         --single-select-option "REFACTOR" \
         --single-select-option "COVER" \
         --single-select-option "Complete"`, { stdio: 'ignore' });
                // Create Criteria Progress field
                (0, child_process_1.execSync)(`gh project field-create "${projectId}" --name "Criteria Progress" --type "text"`, { stdio: 'ignore' });
            }
            catch (error) {
                logger.warn('Failed to create custom fields (continuing anyway)');
            }
        });
    }
    getProjectItemId(projectId, issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const listResult = (0, child_process_1.execSync)(`gh project item-list "${projectId}" --format json`, { encoding: 'utf8' });
                const projectData = JSON.parse(listResult);
                const item = (_a = projectData.items) === null || _a === void 0 ? void 0 : _a.find((item) => { var _a; return ((_a = item.content) === null || _a === void 0 ? void 0 : _a.number) === parseInt(issueNumber); });
                return (item === null || item === void 0 ? void 0 : item.id) || null;
            }
            catch (_b) {
                return null;
            }
        });
    }
    setTddPhase(itemId, phase) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, child_process_1.execSync)(`gh project item-edit --id "${itemId}" --field-id "TDD Phase" --single-select-option-id "${phase}"`, { stdio: 'ignore' });
            }
            catch (error) {
                logger.warn(`Failed to set TDD phase: ${error}`);
            }
        });
    }
    setCriteriaProgress(itemId, progress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, child_process_1.execSync)(`gh project item-edit --id "${itemId}" --field-id "Criteria Progress" --text "${progress}"`, { stdio: 'ignore' });
            }
            catch (error) {
                logger.warn(`Failed to set criteria progress: ${error}`);
            }
        });
    }
}
exports.BoardManager = BoardManager;
