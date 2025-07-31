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
exports.IssueManager = void 0;
const interfaces_1 = require("../domain/interfaces");
class IssueManager {
    constructor(gitManager) {
        this.gitManager = gitManager;
    }
    /**
     * Creates a new GitHub issue with acceptance criteria
     */
    createIssue(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.gitManager.createIssue(options.title, options.body, options.labels);
            }
            catch (error) {
                throw new interfaces_1.GitHubApiException(`Failed to create issue: ${error}`);
            }
        });
    }
    /**
     * Creates an issue with formatted acceptance criteria
     */
    createIssueWithCriteria(title, criteria, description) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = this.formatIssueBody(description || '', criteria);
            return this.createIssue({
                title,
                body,
                labels: ['tdd-ready']
            });
        });
    }
    /**
     * Gets issue data with validation
     */
    getIssue(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.gitManager.issueExists(issueNumber)) {
                throw new interfaces_1.GitHubApiException(`Issue #${issueNumber} not found`);
            }
            try {
                return this.gitManager.getIssueData(issueNumber);
            }
            catch (error) {
                throw new interfaces_1.GitHubApiException(`Failed to get issue #${issueNumber}: ${error}`);
            }
        });
    }
    /**
     * Gets all acceptance criteria from an issue
     */
    getAcceptanceCriteria(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const criteria = this.gitManager.getAcceptanceCriteria(issueNumber);
            return criteria.map((text, index) => ({
                text,
                completed: false, // We don't track completion in the issue body format
                index: index + 1
            }));
        });
    }
    /**
     * Gets a specific acceptance criteria by index
     */
    getCriteriaText(issueNumber, criteriaIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = this.gitManager.getCriteriaText(issueNumber, criteriaIndex);
            if (!text) {
                throw new interfaces_1.GitHubApiException(`No acceptance criteria found at position ${criteriaIndex} for issue #${issueNumber}`);
            }
            return text;
        });
    }
    /**
     * Counts the total number of acceptance criteria in an issue
     */
    countCriteria(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = this.gitManager.countAcceptanceCriteria(issueNumber);
            if (count === 0) {
                throw new interfaces_1.GitHubApiException(`No acceptance criteria found in issue #${issueNumber}. Use format: - [ ] criterion`);
            }
            return count;
        });
    }
    /**
     * Validates that an issue has proper acceptance criteria format
     */
    validateIssueFormat(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const issueData = yield this.getIssue(issueNumber);
                const criteriaPattern = /^- \[ \]/gm;
                const matches = issueData.body.match(criteriaPattern);
                return matches !== null && matches.length > 0;
            }
            catch (_a) {
                return false;
            }
        });
    }
    /**
     * Creates a subissue linked to a parent issue
     */
    createSubissue(parentIssue, title, criteria, description) {
        return __awaiter(this, void 0, void 0, function* () {
            const parentData = yield this.getIssue(parentIssue);
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
            const subissueNumber = yield this.createIssue({
                title: subissueTitle,
                body,
                labels: ['subissue', 'tdd-ready']
            });
            // Add comment to parent issue
            try {
                this.gitManager.commentOnIssue(parentIssue, `Created subissue #${subissueNumber}: ${title}`);
            }
            catch (error) {
                logger.warn(`Failed to comment on parent issue #${parentIssue}`);
            }
            return subissueNumber;
        });
    }
    /**
     * Creates a test subissue for TDD phases (RED or COVER)
     */
    createTestSubissue(parentIssue, phase, criteriaText, criteriaNum) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const subissueNumber = yield this.createIssue({
                    title: config.title,
                    body,
                    labels: ['test', 'subissue', 'tdd-ready']
                });
                // Link subissue to parent issue
                this.gitManager.commentOnIssue(parentIssue, `Related test subissue created: #${subissueNumber}`);
                logger.success(`📝 Created test subissue: #${subissueNumber}`);
                return subissueNumber;
            }
            catch (error) {
                logger.warn('Failed to create test subissue (continuing anyway)');
                return 0;
            }
        });
    }
    /**
     * Closes an issue with optional comment
     */
    closeIssue(issueNumber, comment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.gitManager.closeIssue(issueNumber, comment);
                logger.success(`✅ Closed issue #${issueNumber}`);
            }
            catch (error) {
                throw new interfaces_1.GitHubApiException(`Failed to close issue #${issueNumber}: ${error}`);
            }
        });
    }
    /**
     * Adds a comment to an issue
     */
    commentOnIssue(issueNumber, comment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.gitManager.commentOnIssue(issueNumber, comment);
            }
            catch (error) {
                logger.warn(`Failed to comment on issue #${issueNumber}`);
            }
        });
    }
    /**
     * Gets issue title for display purposes
     */
    getIssueTitle(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const issueData = yield this.getIssue(issueNumber);
                return issueData.title;
            }
            catch (_a) {
                return `Issue ${issueNumber}`;
            }
        });
    }
    /**
     * Formats issue body with description and acceptance criteria
     */
    formatIssueBody(description, criteria) {
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
    isSubissue(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const issueData = yield this.getIssue(issueNumber);
                return issueData.body.includes('Subissue of #') || issueData.title.includes('[');
            }
            catch (_a) {
                return false;
            }
        });
    }
    /**
     * Gets the parent issue number if this is a subissue
     */
    getParentIssue(issueNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const issueData = yield this.getIssue(issueNumber);
                const match = issueData.body.match(/Subissue of #(\d+)/);
                return match ? match[1] : null;
            }
            catch (_a) {
                return null;
            }
        });
    }
}
exports.IssueManager = IssueManager;
