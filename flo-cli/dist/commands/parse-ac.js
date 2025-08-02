"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const acceptance_criteria_parser_1 = require("../acceptance-criteria-parser");
const base_command_1 = require("../base-command");
class ParseAc extends base_command_1.BaseCommand {
    async run() {
        const { args, flags } = await this.parse(ParseAc);
        try {
            let issueBody;
            if (args.issue) {
                const issueNumber = this.validateIssueNumber(args.issue);
                const issue = this.fetchGitHubIssue(issueNumber.toString(), 'body');
                issueBody = issue.body;
            }
            else if (flags.body) {
                issueBody = flags.body;
            }
            else {
                this.error('Either issue number or --body must be provided');
            }
            const criteria = (0, acceptance_criteria_parser_1.parseAcceptanceCriteria)(issueBody);
            if (flags.json) {
                this.log(JSON.stringify({
                    criteria: criteria.map((item, index) => ({
                        index: index + 1,
                        item,
                        checked: false
                    })),
                    total: criteria.length,
                    completed: 0
                }, null, 2));
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
        }
        catch (error) {
            this.handleError(error, 'Failed to parse acceptance criteria');
        }
    }
}
Object.defineProperty(ParseAc, "description", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'Parse acceptance criteria from GitHub issue'
});
Object.defineProperty(ParseAc, "examples", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: [
        '<%= config.bin %> <%= command.id %> 123',
        '<%= config.bin %> <%= command.id %> 123 --json',
        '<%= config.bin %> <%= command.id %> --body "- [ ] First criteria\\n- [ ] Second criteria"',
    ]
});
Object.defineProperty(ParseAc, "flags", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        body: core_1.Flags.string({ description: 'Issue body text' }),
        json: core_1.Flags.boolean({ description: 'Output as JSON' }),
    }
});
Object.defineProperty(ParseAc, "args", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        issue: core_1.Args.string({ description: 'GitHub issue number', required: false }),
    }
});
exports.default = ParseAc;
//# sourceMappingURL=parse-ac.js.map