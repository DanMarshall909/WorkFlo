"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markCriterionComplete = markCriterionComplete;
exports.markCriterionCompleteById = markCriterionCompleteById;
exports.setGitHubClient = setGitHubClient;
exports.updateIssueAC = updateIssueAC;
exports.markCriterionCompleteByText = markCriterionCompleteByText;
exports.markComplete = markComplete;
const github_client_1 = require("./github-client");
/**
 * Marks a specific acceptance criterion as completed by index
 * @param issueBody - The GitHub issue body
 * @param index - 1-based index of the criterion to mark complete
 * @returns Updated issue body with the criterion marked as completed
 */
function markCriterionComplete(issueBody, index) {
    if (!issueBody) {
        throw new Error('Issue body is required');
    }
    const lines = issueBody.split('\n');
    let foundCount = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check if this is an unchecked criterion
        if (/^- \[ \] /.test(line)) {
            foundCount++;
            if (foundCount === index) {
                // Mark this criterion as complete
                lines[i] = line.replace('- [ ]', '- [x]');
                return lines.join('\n');
            }
        }
    }
    throw new Error(`Criterion index ${index} not found`);
}
/**
 * Marks a specific acceptance criterion as completed by AC ID
 * @param issueBody - The GitHub issue body
 * @param acId - The AC ID (e.g., "AC-1", "AC-2")
 * @returns Updated issue body with the criterion marked as completed
 */
function markCriterionCompleteById(issueBody, acId) {
    if (!issueBody) {
        throw new Error('Issue body is required');
    }
    if (!acId) {
        throw new Error('AC ID is required');
    }
    const lines = issueBody.split('\n');
    const acPattern = new RegExp(`^- \\[ \\] ${acId}:`);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (acPattern.test(line)) {
            lines[i] = line.replace('- [ ]', '- [x]');
            return lines.join('\n');
        }
    }
    throw new Error(`AC ID ${acId} not found`);
}
// Default client - can be overridden for testing
let githubClient = new github_client_1.GitHubCLIClient();
/**
 * Set GitHub client (for testing)
 */
function setGitHubClient(client) {
    githubClient = client;
}
/**
 * Updates a GitHub issue's acceptance criteria by description
 * @param issueNumber - The GitHub issue number
 * @param acDescription - Description of the AC to mark complete
 * @returns Promise that resolves with result
 */
async function updateIssueAC(issueNumber, acDescription) {
    try {
        // Get the current issue body
        const currentBody = await githubClient.getIssueBody(issueNumber);
        // Find and mark the AC as complete
        const updatedBody = markCriterionCompleteByText(currentBody, acDescription);
        // Update the issue
        await githubClient.updateIssueBody(issueNumber, updatedBody);
        return {
            success: true,
            message: `AC "${acDescription}" marked as complete in issue #${issueNumber}`
        };
    }
    catch (error) {
        throw new Error(`Failed to update issue: ${error.message}`);
    }
}
/**
 * Marks a criterion as complete by matching the description text
 */
function markCriterionCompleteByText(issueBody, description) {
    if (!issueBody) {
        throw new Error('Issue body is required');
    }
    const lines = issueBody.split('\n');
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check if this line contains the description and is unchecked
        if (/^- \[ \] /.test(line) && line.toLowerCase().includes(description.toLowerCase())) {
            lines[i] = line.replace('- [ ]', '- [x]');
            found = true;
            break;
        }
    }
    if (!found) {
        throw new Error('Acceptance criterion not found');
    }
    return lines.join('\n');
}
function markComplete(options) {
    if (!options.body) {
        throw new Error('Issue body is required');
    }
    if (options.acId) {
        return markCriterionCompleteById(options.body, options.acId);
    }
    else if (options.index) {
        return markCriterionComplete(options.body, options.index);
    }
    else {
        throw new Error('Either index or acId is required');
    }
}
//# sourceMappingURL=issue-updater.js.map