#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const acceptance_criteria_parser_1 = require("./acceptance-criteria-parser");
const issue_updater_1 = require("./issue-updater");
const test_generator_1 = require("./test-generator");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Utility functions
function fetchGitHubIssue(issueNumber, fields = 'body') {
    try {
        const issueData = (0, child_process_1.execSync)(`gh issue view ${issueNumber} --json ${fields}`, { encoding: 'utf-8' });
        return JSON.parse(issueData);
    }
    catch (error) {
        throw new Error(`Failed to fetch GitHub issue ${issueNumber}: ${error.message}`);
    }
}
function validateIssueNumber(issueStr) {
    const issueNumber = parseInt(issueStr);
    if (!issueNumber || issueNumber <= 0) {
        throw new Error(`Invalid issue number: ${issueStr}`);
    }
    return issueNumber;
}
function validateOutputPath(outputPath) {
    const dir = path.dirname(outputPath);
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!outputPath.endsWith('.test.ts')) {
        throw new Error(`Output file must have .test.ts extension: ${outputPath}`);
    }
}
commander_1.program
    .name('flo-cli')
    .description('CLI tools for WorkFlo TDD workflow')
    .version('1.0.0');
// Command to parse acceptance criteria
commander_1.program
    .command('parse-ac')
    .description('Parse acceptance criteria from GitHub issue')
    .option('--issue <number>', 'GitHub issue number')
    .option('--body <text>', 'Issue body text')
    .option('--stdin', 'Read from stdin')
    .action(async (options) => {
    try {
        let issueBody;
        if (options.stdin) {
            // Read from stdin
            const chunks = [];
            for await (const chunk of process.stdin) {
                chunks.push(chunk);
            }
            issueBody = Buffer.concat(chunks).toString();
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
            console.error('Error: Must provide --issue, --body, or --stdin');
            process.exit(1);
        }
        const criteria = (0, acceptance_criteria_parser_1.parseAcceptanceCriteria)(issueBody);
        console.log(JSON.stringify({
            criteria: criteria.map((text, index) => ({
                index: index + 1,
                text,
                checked: false
            })),
            total: criteria.length,
            completed: 0
        }, null, 2));
    }
    catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
});
// Command to mark acceptance criteria as complete
commander_1.program
    .command('mark-ac-complete')
    .description('Mark acceptance criterion as complete in GitHub issue')
    .requiredOption('--issue <number>', 'GitHub issue number')
    .requiredOption('--description <text>', 'AC description to mark complete')
    .action(async (options) => {
    try {
        const result = await (0, issue_updater_1.updateIssueAC)(parseInt(options.issue), options.description);
        console.log(result.message);
    }
    catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
});
// Command to generate tests from acceptance criteria
commander_1.program
    .command('generate-tests')
    .description('Generate TypeScript/Jest test files from GitHub issue acceptance criteria')
    .requiredOption('--issue <number>', 'GitHub issue number')
    .requiredOption('--output <path>', 'Output path for generated test file')
    .action(async (options) => {
    try {
        // Validate inputs
        const issueNumber = validateIssueNumber(options.issue);
        validateOutputPath(options.output);
        // Fetch issue data from GitHub
        const issue = fetchGitHubIssue(issueNumber, 'body,title');
        // Parse acceptance criteria from issue body
        const criteria = (0, acceptance_criteria_parser_1.parseAcceptanceCriteria)(issue.body);
        if (criteria.length === 0) {
            throw new Error(`No acceptance criteria found in issue #${issueNumber}`);
        }
        // Create structured parse result
        const parseResult = (0, test_generator_1.createParseResult)(criteria, issueNumber, issue.title);
        // Generate tests using new-file strategy
        const insertionOptions = {
            strategy: 'new-file',
            targetFile: options.output
        };
        const resultFile = (0, test_generator_1.generateAndInsertTests)(parseResult, insertionOptions);
        console.log(`Generated test file: ${resultFile}`);
        console.log(`Generated ${criteria.length} test cases from issue #${issueNumber}`);
    }
    catch (error) {
        console.error(`Error generating tests: ${error.message}`);
        process.exit(1);
    }
});
// Command for autonomous TDD workflow
commander_1.program
    .command('auto')
    .description('Autonomous TDD workflow for issues with multiple acceptance criteria')
    .argument('<issue>', 'GitHub issue number')
    .action(async (issue) => {
    try {
        const issueNumber = validateIssueNumber(issue);
        console.log(`Starting autonomous TDD workflow for issue #${issueNumber}`);
        // Minimal implementation - just acknowledge the command
        console.log('Auto workflow not yet implemented');
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
});
commander_1.program.parse();
//# sourceMappingURL=cli.js.map