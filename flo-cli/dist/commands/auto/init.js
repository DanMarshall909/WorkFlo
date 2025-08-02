"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@oclif/core");
const auto_state_1 = require("../../auto-state");
const acceptance_criteria_parser_1 = require("../../acceptance-criteria-parser");
const base_command_1 = require("../../base-command");
const child_process_1 = require("child_process");
const path = tslib_1.__importStar(require("path"));
class AutoInit extends base_command_1.BaseCommand {
    async run() {
        const { args, flags } = await this.parse(AutoInit);
        try {
            const issueNumber = this.validateIssueNumber(args.issue);
            // Get acceptance criteria count
            const issueData = this.fetchGitHubIssue(issueNumber.toString(), 'body');
            const issueBody = issueData.body;
            const criteria = (0, acceptance_criteria_parser_1.parseAcceptanceCriteria)(issueBody);
            if (criteria.length === 0) {
                this.error('No acceptance criteria found to track');
            }
            if (!flags['state-only']) {
                // Initialize TDD session first
                if (process.env['NODE_ENV'] !== 'test') {
                    (0, child_process_1.execSync)(`./tdd start ${issueNumber}`, {
                        cwd: path.resolve(process.cwd(), '..'),
                        stdio: 'inherit'
                    });
                }
            }
            // Initialize state management
            const stateService = new auto_state_1.AutoWorkflowStateService();
            await stateService.initializeState(issueNumber, criteria.length);
            const result = {
                issue: issueNumber,
                criteriaCount: criteria.length,
                message: `Auto workflow initialized for issue #${issueNumber}`,
                tddSession: !flags['state-only'],
                stateManagement: true
            };
            if (flags.json) {
                this.log(JSON.stringify(result, null, 2));
            }
            else {
                this.log(`🚀 Auto workflow initialized for issue #${issueNumber}`);
                this.log(`📊 Tracking ${criteria.length} acceptance criteria`);
                this.log(`📍 Current AC: 1, Phase: START`);
                if (!flags['state-only']) {
                    this.log('✅ TDD session started');
                }
                this.log('✅ State management initialized');
            }
        }
        catch (error) {
            this.handleError(error, 'Failed to initialize auto workflow');
        }
    }
}
Object.defineProperty(AutoInit, "description", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'Initialize TDD session and auto workflow state'
});
Object.defineProperty(AutoInit, "examples", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: [
        '<%= config.bin %> <%= command.id %> 123',
        '<%= config.bin %> <%= command.id %> 123 --state-only',
    ]
});
Object.defineProperty(AutoInit, "args", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        issue: core_1.Args.string({ description: 'GitHub issue number', required: true }),
    }
});
Object.defineProperty(AutoInit, "flags", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        'state-only': core_1.Flags.boolean({ description: 'Initialize state management only, skip TDD session' }),
        json: core_1.Flags.boolean({ description: 'Output structured JSON for machine parsing' }),
    }
});
exports.default = AutoInit;
//# sourceMappingURL=init.js.map