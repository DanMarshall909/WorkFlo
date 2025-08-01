"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const acceptance_criteria_parser_1 = require("../../acceptance-criteria-parser");
const base_command_1 = require("../../base-command");
class AutoRun extends base_command_1.BaseCommand {
    async run() {
        const { args, flags } = await this.parse(AutoRun);
        try {
            const issueNumber = this.validateIssueNumber(args.issue);
            const issueData = this.fetchGitHubIssue(issueNumber.toString(), 'body');
            const issueBody = issueData.body;
            const criteria = (0, acceptance_criteria_parser_1.parseAcceptanceCriteria)(issueBody);
            if (flags['parse-only']) {
                const result = {
                    issue: issueNumber,
                    criteriaCount: criteria.length,
                    criteria: criteria,
                    message: criteria.length === 0 ? 'No acceptance criteria found' : `Found ${criteria.length} acceptance criteria`
                };
                if (flags.json) {
                    this.log(JSON.stringify(result, null, 2));
                }
                else {
                    if (criteria.length === 0) {
                        this.log('No acceptance criteria found');
                    }
                    else {
                        this.log(`Found ${criteria.length} acceptance criteria:`);
                        criteria.forEach((criterion, index) => {
                            this.log(`${index + 1}. ${criterion}`);
                        });
                    }
                }
                return;
            }
            if (criteria.length === 0) {
                this.error('No acceptance criteria found for autonomous workflow');
            }
            // TODO: Implement full autonomous workflow
            this.log(`🚀 Starting autonomous TDD workflow for issue #${issueNumber}`);
            this.log(`📊 Processing ${criteria.length} acceptance criteria`);
            this.log('🔄 Auto workflow implementation in progress...');
            // For now, show what would be processed
            criteria.forEach((criterion, index) => {
                this.log(`${index + 1}. ${criterion}`);
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.error(`Failed to run auto workflow: ${message}`);
        }
    }
}
Object.defineProperty(AutoRun, "description", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'Run autonomous TDD workflow for multiple acceptance criteria'
});
Object.defineProperty(AutoRun, "examples", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: [
        '<%= config.bin %> <%= command.id %> 123',
        '<%= config.bin %> <%= command.id %> 123 --parse-only',
    ]
});
Object.defineProperty(AutoRun, "args", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        issue: core_1.Args.string({ description: 'GitHub issue number', required: true }),
    }
});
Object.defineProperty(AutoRun, "flags", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        'parse-only': core_1.Flags.boolean({ description: 'Parse issue and show acceptance criteria count only' }),
        json: core_1.Flags.boolean({ description: 'Output structured JSON for machine parsing' }),
    }
});
exports.default = AutoRun;
//# sourceMappingURL=run.js.map