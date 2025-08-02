"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommand = void 0;
const core_1 = require("@oclif/core");
const child_process_1 = require("child_process");
class BaseCommand extends core_1.Command {
    fetchGitHubIssue(issueNumber, fields = 'body') {
        try {
            const issueData = (0, child_process_1.execSync)(`gh issue view ${issueNumber} --json ${fields}`, { encoding: 'utf-8' });
            return JSON.parse(issueData);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to fetch GitHub issue ${issueNumber}: ${message}`);
        }
    }
    validateIssueNumber(issueStr) {
        const issueNumber = parseInt(issueStr);
        if (!issueNumber || issueNumber <= 0) {
            throw new Error(`Invalid issue number: ${issueStr}`);
        }
        return issueNumber;
    }
    handleError(error, context) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.error(`${context}: ${errorMessage}`);
    }
    escapeShellArg(arg) {
        return `'${arg.replace(/'/g, "'\"'\"'")}'`;
    }
}
exports.BaseCommand = BaseCommand;
//# sourceMappingURL=base-command.js.map