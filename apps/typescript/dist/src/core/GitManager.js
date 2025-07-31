"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitManager = void 0;
const child_process_1 = require("child_process");
class GitManager {
    // Git operations
    getCurrentBranch() {
        try {
            return (0, child_process_1.execSync)('git branch --show-current', { encoding: 'utf8' }).trim();
        }
        catch (error) {
            throw new Error('Failed to get current branch. Are you in a git repository?');
        }
    }
    branchExists(branchName) {
        try {
            (0, child_process_1.execSync)(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    createAndSwitchBranch(branchName) {
        try {
            (0, child_process_1.execSync)(`git checkout -b "${branchName}"`, { stdio: 'inherit' });
        }
        catch (error) {
            throw new Error(`Failed to create and switch to branch: ${branchName}`);
        }
    }
    switchBranch(branchName) {
        try {
            (0, child_process_1.execSync)(`git checkout "${branchName}"`, { stdio: 'inherit' });
        }
        catch (error) {
            throw new Error(`Failed to switch to branch: ${branchName}`);
        }
    }
    hasChanges() {
        try {
            (0, child_process_1.execSync)('git diff --quiet', { stdio: 'ignore' });
            return false; // No changes if git diff --quiet succeeds
        }
        catch (_a) {
            return true; // Changes exist if git diff --quiet fails
        }
    }
    stageAll() {
        try {
            (0, child_process_1.execSync)('git add .', { stdio: 'ignore' });
        }
        catch (error) {
            throw new Error('Failed to stage changes');
        }
    }
    commit(options) {
        try {
            const allowEmptyFlag = options.allowEmpty ? '--allow-empty' : '';
            const escapedMessage = options.message.replace(/"/g, '\\"');
            (0, child_process_1.execSync)(`git commit ${allowEmptyFlag} -m "${escapedMessage}"`, { stdio: 'ignore' });
        }
        catch (error) {
            throw new Error('Failed to create commit');
        }
    }
    autoCommit(message) {
        try {
            this.stageAll();
            this.commit({ message });
            logger.success('💾 Auto-committed changes');
        }
        catch (error) {
            logger.warn('⚠️  Auto-commit failed (continuing anyway)');
        }
    }
    getCommitCount(baseBranch = 'master') {
        try {
            const result = (0, child_process_1.execSync)(`git rev-list --count HEAD ^${baseBranch}`, { encoding: 'utf8' });
            return parseInt(result.trim()) || 0;
        }
        catch (_a) {
            return 0;
        }
    }
    // GitHub CLI operations
    checkGithubAuth() {
        try {
            (0, child_process_1.execSync)('gh auth status', { stdio: 'ignore' });
        }
        catch (_a) {
            throw new Error('GitHub CLI not authenticated. Run: gh auth login');
        }
    }
    checkPrerequisites() {
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
                throw new Error(error);
            }
        }
        this.checkGithubAuth();
    }
    issueExists(issueNumber) {
        try {
            (0, child_process_1.execSync)(`gh issue view "${issueNumber}"`, { stdio: 'ignore' });
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    getIssueData(issueNumber) {
        try {
            const result = (0, child_process_1.execSync)(`gh issue view "${issueNumber}" --json number,title,body,state`, { encoding: 'utf8' });
            return JSON.parse(result);
        }
        catch (error) {
            throw new Error(`Failed to get issue #${issueNumber}: ${error}`);
        }
    }
    getAcceptanceCriteria(issueNumber) {
        const issueData = this.getIssueData(issueNumber);
        return issueData.body
            .split('\n')
            .filter(line => line.match(/^- \[ \]/))
            .map(line => line.replace(/^- \[ \] /, ''));
    }
    getCriteriaText(issueNumber, criteriaIndex) {
        const criteria = this.getAcceptanceCriteria(issueNumber);
        return criteria[criteriaIndex - 1] || '';
    }
    countAcceptanceCriteria(issueNumber) {
        return this.getAcceptanceCriteria(issueNumber).length;
    }
    createIssue(title, body, labels) {
        try {
            const labelFlag = labels && labels.length > 0 ? `--label "${labels.join(',')}"` : '';
            const result = (0, child_process_1.execSync)(`gh issue create --title "${title}" --body "${body}" ${labelFlag}`, { encoding: 'utf8' });
            const match = result.match(/#(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }
        catch (error) {
            throw new Error(`Failed to create issue: ${error}`);
        }
    }
    commentOnIssue(issueNumber, comment) {
        try {
            (0, child_process_1.execSync)(`gh issue comment "${issueNumber}" --body "${comment}"`, { stdio: 'ignore' });
        }
        catch (error) {
            logger.warn(`Failed to comment on issue #${issueNumber}`);
        }
    }
    closeIssue(issueNumber, comment) {
        try {
            const commentFlag = comment ? `--comment "${comment}"` : '';
            (0, child_process_1.execSync)(`gh issue close "${issueNumber}" ${commentFlag}`, { stdio: 'ignore' });
        }
        catch (error) {
            throw new Error(`Failed to close issue #${issueNumber}`);
        }
    }
    createPullRequest(title, body, baseBranch = 'master') {
        try {
            const currentBranch = this.getCurrentBranch();
            const result = (0, child_process_1.execSync)(`gh pr create --title "${title}" --body "${body}" --base ${baseBranch} --head ${currentBranch}`, { encoding: 'utf8' });
            // Extract PR URL from output
            const urlMatch = result.match(/https:\/\/github\.com\/[^\s]+/);
            const url = urlMatch ? urlMatch[0] : '';
            // Extract PR number from URL
            const numberMatch = url.match(/\/pull\/(\d+)$/);
            const number = numberMatch ? parseInt(numberMatch[1]) : 0;
            return {
                number,
                title,
                body,
                url,
                state: 'open'
            };
        }
        catch (error) {
            throw new Error(`Failed to create pull request: ${error}`);
        }
    }
    pushBranch(branchName) {
        try {
            const branch = branchName || this.getCurrentBranch();
            (0, child_process_1.execSync)(`git push origin "${branch}"`, { stdio: 'inherit' });
        }
        catch (error) {
            throw new Error(`Failed to push branch: ${error}`);
        }
    }
    pushBranchWithUpstream(branchName) {
        try {
            const branch = branchName || this.getCurrentBranch();
            (0, child_process_1.execSync)(`git push -u origin "${branch}"`, { stdio: 'inherit' });
        }
        catch (error) {
            throw new Error(`Failed to push branch with upstream: ${error}`);
        }
    }
    // Repository information
    getRepositoryOwner() {
        try {
            const result = (0, child_process_1.execSync)('gh repo view --json owner', { encoding: 'utf8' });
            return JSON.parse(result).owner.login;
        }
        catch (error) {
            throw new Error('Failed to get repository owner');
        }
    }
    getRepositoryName() {
        try {
            const result = (0, child_process_1.execSync)('gh repo view --json name', { encoding: 'utf8' });
            return JSON.parse(result).name;
        }
        catch (error) {
            throw new Error('Failed to get repository name');
        }
    }
    isInGitRepository() {
        try {
            (0, child_process_1.execSync)('git rev-parse --git-dir', { stdio: 'ignore' });
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    // Utility methods
    generateBranchName(issueNumber) {
        return `feature/issue-${issueNumber}`;
    }
    generateCommitMessage(phase, criteriaNum, criteriaText, issueNumber, issueTitle) {
        const phaseEmojis = {
            'RED': '🔴RED',
            'GREEN': '🟢GRN',
            'REFACTOR': '🔵REF',
            'COVER': '🟣COV'
        };
        const phaseAbbrev = phaseEmojis[phase] || phase;
        const currentBranch = this.getCurrentBranch();
        const title = issueTitle || `Issue ${issueNumber}`;
        return `${phaseAbbrev}: criteria ${criteriaNum} - ${criteriaText}

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
    }
}
exports.GitManager = GitManager;
