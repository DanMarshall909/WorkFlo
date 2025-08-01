"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const issue_updater_1 = require("../issue-updater");
const base_command_1 = require("../base-command");
class UpdateIssueAc extends base_command_1.BaseCommand {
    async run() {
        const { args } = await this.parse(UpdateIssueAc);
        try {
            const issueNumber = this.validateIssueNumber(args.issue);
            const result = await (0, issue_updater_1.updateIssue)(issueNumber, args.criteria);
            this.log(result.message);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.error(`Failed to update issue: ${message}`);
        }
    }
}
Object.defineProperty(UpdateIssueAc, "description", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'Update acceptance criteria status in GitHub issue'
});
Object.defineProperty(UpdateIssueAc, "examples", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: [
        '<%= config.bin %> <%= command.id %> 123 "Add CLI command for generation"',
    ]
});
Object.defineProperty(UpdateIssueAc, "args", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        issue: core_1.Args.string({ description: 'GitHub issue number', required: true }),
        criteria: core_1.Args.string({ description: 'Acceptance criteria text to update', required: true }),
    }
});
exports.default = UpdateIssueAc;
//# sourceMappingURL=update-issue-ac.js.map