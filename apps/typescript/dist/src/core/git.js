"use strict";
// Functional git and GitHub operations
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommitMessage = exports.generateBranchName = exports.getRepositoryName = exports.getRepositoryOwner = exports.closeIssue = exports.commentOnIssue = exports.createIssue = exports.countAcceptanceCriteria = exports.getCriteriaText = exports.getAcceptanceCriteria = exports.getIssueData = exports.issueExists = exports.checkPrerequisites = exports.checkGithubAuth = exports.isInGitRepository = exports.getCommitCount = exports.autoCommit = exports.commit = exports.stageAll = exports.hasChanges = exports.switchBranch = exports.createAndSwitchBranch = exports.branchExists = exports.getCurrentBranch = void 0;
const child_process_1 = require("child_process");
const result_1 = require("../types/core/result");
const errors_1 = require("../types/errors");
// Git operations
const getCurrentBranch = () => {
    try {
        const branch = (0, child_process_1.execSync)('git branch --show-current', { encoding: 'utf8' }).trim();
        return (0, result_1.Ok)(branch);
    }
    catch (error) {
        return (0, result_1.Err)(new Error('Failed to get current branch. Are you in a git repository?'));
    }
};
exports.getCurrentBranch = getCurrentBranch;
const branchExists = (branchName) => {
    try {
        (0, child_process_1.execSync)(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.branchExists = branchExists;
const createAndSwitchBranch = (branchName) => {
    try {
        (0, child_process_1.execSync)(`git checkout -b "${branchName}"`, { stdio: 'inherit' });
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new Error(`Failed to create and switch to branch: ${branchName}`));
    }
};
exports.createAndSwitchBranch = createAndSwitchBranch;
const switchBranch = (branchName) => {
    try {
        (0, child_process_1.execSync)(`git checkout "${branchName}"`, { stdio: 'inherit' });
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new Error(`Failed to switch to branch: ${branchName}`));
    }
};
exports.switchBranch = switchBranch;
const hasChanges = () => {
    try {
        (0, child_process_1.execSync)('git diff --quiet', { stdio: 'ignore' });
        return false; // No changes if git diff --quiet succeeds
    }
    catch (_a) {
        return true; // Changes exist if git diff --quiet fails
    }
};
exports.hasChanges = hasChanges;
const stageAll = () => {
    try {
        (0, child_process_1.execSync)('git add .', { stdio: 'ignore' });
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new Error('Failed to stage changes'));
    }
};
exports.stageAll = stageAll;
const commit = (message, allowEmpty = false) => {
    try {
        const allowEmptyFlag = allowEmpty ? '--allow-empty' : '';
        const escapedMessage = message.replace(/"/g, '\\"');
        (0, child_process_1.execSync)(`git commit ${allowEmptyFlag} -m "${escapedMessage}"`, { stdio: 'ignore' });
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new Error('Failed to create commit'));
    }
};
exports.commit = commit;
const autoCommit = (message) => {
    const stageResult = (0, exports.stageAll)();
    if (!stageResult.success)
        return stageResult;
    return (0, exports.commit)(message);
};
exports.autoCommit = autoCommit;
const getCommitCount = (baseBranch = 'master') => {
    try {
        const result = (0, child_process_1.execSync)(`git rev-list --count HEAD ^${baseBranch}`, { encoding: 'utf8' });
        return parseInt(result.trim()) || 0;
    }
    catch (_a) {
        return 0;
    }
};
exports.getCommitCount = getCommitCount;
const isInGitRepository = () => {
    try {
        (0, child_process_1.execSync)('git rev-parse --git-dir', { stdio: 'ignore' });
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.isInGitRepository = isInGitRepository;
// GitHub CLI operations
const checkGithubAuth = () => {
    try {
        (0, child_process_1.execSync)('gh auth status', { stdio: 'ignore' });
        return (0, result_1.Ok)(undefined);
    }
    catch (_a) {
        return (0, result_1.Err)(new Error('GitHub CLI not authenticated. Run: gh auth login'));
    }
};
exports.checkGithubAuth = checkGithubAuth;
const checkPrerequisites = () => {
    const commands = [
        { cmd: 'gh --version', error: 'GitHub CLI required: https://cli.github.com/' },
        { cmd: 'jq --version', error: 'jq required: sudo apt-get install jq' },
        { cmd: 'bc --version', error: 'bc required: sudo apt-get install bc' }
    ];
    for (const { cmd, error } of commands) {
        try {
            (0, child_process_1.execSync)(cmd, { stdio: 'ignore' });
        }
        catch (_a) {
            return (0, result_1.Err)(new Error(error));
        }
    }
    return (0, exports.checkGithubAuth)();
};
exports.checkPrerequisites = checkPrerequisites;
const issueExists = (issueNumber) => {
    try {
        (0, child_process_1.execSync)(`gh issue view "${issueNumber}"`, { stdio: 'ignore' });
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.issueExists = issueExists;
const getIssueData = (issueNumber) => {
    try {
        const result = (0, child_process_1.execSync)(`gh issue view "${issueNumber}" --json number,title,body,state`, { encoding: 'utf8' });
        const data = JSON.parse(result);
        return (0, result_1.Ok)(data);
    }
    catch (error) {
        return (0, result_1.Err)(new errors_1.GitHubApiError(`Failed to get issue #${issueNumber}: ${error}`));
    }
};
exports.getIssueData = getIssueData;
const getAcceptanceCriteria = (issueNumber) => {
    const issueResult = (0, exports.getIssueData)(issueNumber);
    if (!issueResult.success)
        return issueResult;
    const criteria = issueResult.data.body
        .split('\n')
        .filter(line => line.match(/^- \[ \]/))
        .map(line => line.replace(/^- \[ \] /, ''));
    return (0, result_1.Ok)(criteria);
};
exports.getAcceptanceCriteria = getAcceptanceCriteria;
const getCriteriaText = (issueNumber, criteriaIndex) => {
    const criteriaResult = (0, exports.getAcceptanceCriteria)(issueNumber);
    if (!criteriaResult.success)
        return criteriaResult;
    const text = criteriaResult.data[criteriaIndex - 1];
    if (!text) {
        return (0, result_1.Err)(new Error(`No acceptance criteria found at position ${criteriaIndex}`));
    }
    return (0, result_1.Ok)(text);
};
exports.getCriteriaText = getCriteriaText;
const countAcceptanceCriteria = (issueNumber) => {
    const criteriaResult = (0, exports.getAcceptanceCriteria)(issueNumber);
    if (!criteriaResult.success)
        return criteriaResult;
    const count = criteriaResult.data.length;
    if (count === 0) {
        return (0, result_1.Err)(new Error(`No acceptance criteria found in issue #${issueNumber}. Use format: - [ ] criterion`));
    }
    return (0, result_1.Ok)(count);
};
exports.countAcceptanceCriteria = countAcceptanceCriteria;
const createIssue = (title, body, labels = []) => {
    try {
        const labelFlag = labels.length > 0 ? `--label "${labels.join(',')}"` : '';
        const result = (0, child_process_1.execSync)(`gh issue create --title "${title}" --body "${body}" ${labelFlag}`, { encoding: 'utf8' });
        const match = result.match(/#(\d+)/);
        const issueNumber = match ? parseInt(match[1]) : 0;
        if (issueNumber === 0) {
            return (0, result_1.Err)(new errors_1.GitHubApiError('Failed to extract issue number from response'));
        }
        return (0, result_1.Ok)(issueNumber);
    }
    catch (error) {
        return (0, result_1.Err)(new errors_1.GitHubApiError(`Failed to create issue: ${error}`));
    }
};
exports.createIssue = createIssue;
const commentOnIssue = (issueNumber, comment) => {
    try {
        (0, child_process_1.execSync)(`gh issue comment "${issueNumber}" --body "${comment}"`, { stdio: 'ignore' });
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new errors_1.GitHubApiError(`Failed to comment on issue #${issueNumber}: ${error}`));
    }
};
exports.commentOnIssue = commentOnIssue;
const closeIssue = (issueNumber, comment) => {
    try {
        const commentFlag = comment ? `--comment "${comment}"` : '';
        (0, child_process_1.execSync)(`gh issue close "${issueNumber}" ${commentFlag}`, { stdio: 'ignore' });
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new errors_1.GitHubApiError(`Failed to close issue #${issueNumber}: ${error}`));
    }
};
exports.closeIssue = closeIssue;
const getRepositoryOwner = () => {
    try {
        const result = (0, child_process_1.execSync)('gh repo view --json owner', { encoding: 'utf8' });
        const data = JSON.parse(result);
        return (0, result_1.Ok)(data.owner.login);
    }
    catch (error) {
        return (0, result_1.Err)(new errors_1.GitHubApiError('Failed to get repository owner'));
    }
};
exports.getRepositoryOwner = getRepositoryOwner;
const getRepositoryName = () => {
    try {
        const result = (0, child_process_1.execSync)('gh repo view --json name', { encoding: 'utf8' });
        const data = JSON.parse(result);
        return (0, result_1.Ok)(data.name);
    }
    catch (error) {
        return (0, result_1.Err)(new errors_1.GitHubApiError('Failed to get repository name'));
    }
};
exports.getRepositoryName = getRepositoryName;
// Utility functions
const generateBranchName = (issueNumber) => {
    return `feature/issue-${issueNumber}`;
};
exports.generateBranchName = generateBranchName;
const generateCommitMessage = (phase, criteriaNum, criteriaText, issueNumber, issueTitle) => {
    const branchResult = (0, exports.getCurrentBranch)();
    const currentBranch = branchResult.success ? branchResult.data : 'unknown';
    const phaseEmojis = {
        'RED': '🔴RED',
        'GREEN': '🟢GRN',
        'REFACTOR': '🔵REF',
        'COVER': '🟣COV'
    };
    const phaseAbbrev = phaseEmojis[phase] || phase;
    const title = issueTitle || `Issue ${issueNumber}`;
    const message = `${phaseAbbrev}: criteria ${criteriaNum} - ${criteriaText}

Issue: #${issueNumber} - ${title}
Criteria: ${criteriaNum}/total
Phase: ${phase}
Branch: ${currentBranch}

Changes:
- TDD ${phase} phase implementation
- Focus: ${criteriaText}

Linked-to: #${issueNumber}
TDD-Phase: ${phase}
Criteria-Progress: ${criteriaNum}/total

🤖 Generated with WorkFlo TDD automation`;
    return (0, result_1.Ok)(message);
};
exports.generateCommitMessage = generateCommitMessage;
