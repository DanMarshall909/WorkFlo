"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@oclif/core");
const test_generator_1 = require("../test-generator");
const acceptance_criteria_parser_1 = require("../acceptance-criteria-parser");
const base_command_1 = require("../base-command");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
class GenerateTests extends base_command_1.BaseCommand {
    async run() {
        const { args } = await this.parse(GenerateTests);
        try {
            const issueNumber = this.validateIssueNumber(args.issue);
            this.ensureDirectoryExists(args.output);
            // Fetch issue data with full context
            const issue = this.fetchGitHubIssue(issueNumber.toString(), 'body,title');
            // Parse acceptance criteria from issue body
            const criteria = (0, acceptance_criteria_parser_1.parseAcceptanceCriteria)(issue.body);
            if (criteria.length === 0) {
                this.error(`No acceptance criteria found in issue #${issueNumber}`);
            }
            // Generate tests based on criteria
            const testContent = (0, test_generator_1.generateTests)(criteria, issueNumber, issue.title);
            // Configure test generation options
            const generationOptions = {
                strategy: 'new-file',
                outputPath: args.output
            };
            const resultPath = (0, test_generator_1.generateTestContent)(testContent, generationOptions);
            this.log(`✅ Generated tests: ${resultPath}`);
            this.log(`📊 Created ${criteria.length} test scenarios for issue #${issueNumber}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.error(`Test generation failed: ${message}`);
        }
    }
    ensureDirectoryExists(outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!outputPath.endsWith('.test.ts')) {
            this.error(`Output path must end with '.test.ts': ${outputPath}`);
        }
    }
}
Object.defineProperty(GenerateTests, "description", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'Generate comprehensive tests from GitHub issue acceptance criteria'
});
Object.defineProperty(GenerateTests, "examples", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: [
        '<%= config.bin %> <%= command.id %> 123 tests/feature.test.ts',
    ]
});
Object.defineProperty(GenerateTests, "args", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        issue: core_1.Args.string({ description: 'GitHub issue number', required: true }),
        output: core_1.Args.string({ description: 'Output path for generated test file', required: true }),
    }
});
exports.default = GenerateTests;
//# sourceMappingURL=generate-tests.js.map