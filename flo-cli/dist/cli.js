#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const commander_1 = require("commander");
const acceptance_criteria_parser_1 = require("./acceptance-criteria-parser");
const issue_updater_1 = require("./issue-updater");
const test_generator_1 = require("./test-generator");
const child_process_1 = require("child_process");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
// Utility functions
function fetchGitHubIssue(issueNumber, fields = 'body') {
    try {
        const issueData = (0, child_process_1.execSync)(`gh issue view ${issueNumber} --json ${fields}`, { encoding: 'utf-8' });
        return JSON.parse(issueData);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to fetch GitHub issue ${issueNumber}: ${message}`);
    }
}
function validateIssueNumber(issueStr) {
    const issueNumber = parseInt(issueStr);
    if (!issueNumber || issueNumber <= 0) {
        throw new Error(`Invalid issue number: ${issueStr}`);
    }
    return issueNumber;
}
function ensureDirectoryExists(outputPath) {
    const dir = path.dirname(outputPath);
    // Create directory recursively if it doesn't exist
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!outputPath.endsWith('.test.ts')) {
        throw new Error(`Output path must end with '.test.ts': ${outputPath}`);
    }
}
commander_1.program
    .name('flo-cli')
    .description('CLI for flo project management')
    .version('1.0.0');
// Command for parsing acceptance criteria
commander_1.program
    .command('parse-ac')
    .description('Parse acceptance criteria from GitHub issue')
    .requiredOption('--issue <number>', 'GitHub issue number')
    .option('--body <text>', 'Issue body text')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
    try {
        let issueBody;
        if (options.files) {
            // Read from files
            const bodies = [];
            for await (const files of options.files) {
                bodies.push(files);
            }
            issueBody = bodies.concat(bodies).toString();
        }
        else if (options.issue) {
            // Fetch from GitHub
            const issueNumber = validateIssueNumber(options.issue);
            const issue = fetchGitHubIssue(issueNumber, 'body');
            issueBody = issue.body;
        }
        else if (options.body) {
            issueBody = options.body;
        }
        else {
            console.error('Error: Either --issue, --body, or --files must be provided');
            process.exit(1);
        }
        const criteria = (0, acceptance_criteria_parser_1.parseAcceptanceCriteria)(issueBody);
        console.log(JSON.stringify({
            criteria: criteria.map((item, index) => ({
                index: index + 1,
                item,
                checked: false
            })),
            total: criteria.length,
            completed: 0
        }, null, 2));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error:', message);
        process.exit(1);
    }
});
// Command for updating GitHub issue with test results
commander_1.program
    .command('update-issue-ac')
    .description('Update acceptance criteria status in GitHub issue')
    .requiredOption('--issue <number>', 'GitHub issue number')
    .requiredOption('--criteria <text>', 'Acceptance criteria text to update')
    .action(async (options) => {
    try {
        const result = await (0, issue_updater_1.updateIssue)(parseInt(options.issue), options.criteria);
        console.log(result.message);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error:', message);
        process.exit(1);
    }
});
// Command for generating tests from GitHub issues
commander_1.program
    .command('generate-tests')
    .description('Generate comprehensive tests from GitHub issue acceptance criteria')
    .requiredOption('--issue <number>', 'GitHub issue number')
    .requiredOption('--output <path>', 'Output path for generated test file')
    .action(async (options) => {
    try {
        // Validate inputs
        const issueNumber = validateIssueNumber(options.issue);
        ensureDirectoryExists(options.output);
        // Fetch issue data with full context
        const issue = fetchGitHubIssue(issueNumber, 'body,title');
        // Parse acceptance criteria from issue body
        const criteria = (0, acceptance_criteria_parser_1.parseAcceptanceCriteria)(issue.body);
        if (criteria.length === 0) {
            throw new Error(`No acceptance criteria found in issue #${issueNumber}`);
        }
        // Generate tests based on criteria
        const testContent = (0, test_generator_1.generateTests)(criteria, issueNumber, issue.title);
        // Configure test generation options
        const generationOptions = {
            strategy: 'new-file',
            outputPath: options.output
        };
        const resultPath = generateTestContent(testContent, generationOptions);
        console.log(`✅ Generated tests: ${resultPath}`);
        console.log(`📊 Created ${criteria.length} test scenarios for issue #${issueNumber}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Test generation failed: ${message}`);
        process.exit(1);
    }
});
// Command for autonomous TDD workflow
commander_1.program
    .command('auto')
    .description('Autonomous TDD workflow for issues with multiple acceptance criteria')
    .argument('[issue]', 'GitHub issue number')
    .option('--status', 'Show current auto workflow progress checking')
    .addHelpText('after', `
Examples:
  $ flo-cli auto 123                    Start autonomous workflow for issue #123
  $ flo-cli auto --status               Check current workflow progress

The auto command automatically cycles through TDD phases (RED-GREEN-REFACTOR-COVER-DOCUMENT) 
for each acceptance criteria in the GitHub issue. It provides autonomous development 
with built-in quality gates and progress tracking.`)
    .action(async (issue, options) => {
    try {
        if (options.status) {
            console.log('No active auto workflow running');
            return;
        }
        if (!issue) {
            console.error('Error: Issue number is required');
            process.exit(1);
        }
        const issueNumber = validateIssueNumber(issue);
        console.log(`🚀 Starting autonomous TDD workflow for issue #${issueNumber}`);
        // TODO: Implement full autonomous workflow
        console.log('Auto workflow implementation in progress...');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error: ${message}`);
        process.exit(1);
    }
});
commander_1.program.parse();
//# sourceMappingURL=cli.js.map