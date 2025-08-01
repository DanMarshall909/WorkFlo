"use strict";
/**
 * Command Handler Architecture
 * Refactors the monolithic 379-line action handler into focused, testable classes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRouter = exports.InitSessionCommandHandler = exports.ParseOnlyCommandHandler = exports.StatusCommandHandler = void 0;
exports.outputResult = outputResult;
const tslib_1 = require("tslib");
const auto_state_1 = require("./auto-state");
const acceptance_criteria_parser_1 = require("./acceptance-criteria-parser");
const child_process_1 = require("child_process");
const path = tslib_1.__importStar(require("path"));
function outputResult(data, options) {
    if (options.json) {
        console.log(JSON.stringify(data, null, 2));
    }
    else {
        // Human-readable output
        if (data.success) {
            console.log(data.message);
            if (data.details) {
                data.details.forEach((detail) => console.log(detail));
            }
        }
        else {
            console.error(`Error: ${data.error}`);
        }
    }
}
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
class StatusCommandHandler {
    canHandle(options) {
        return !!options.status;
    }
    async execute(_issueNumber, _options) {
        // Check for active auto workflow state
        const stateService = new auto_state_1.AutoWorkflowStateService();
        const state = await stateService.getCurrentState();
        if (!state) {
            return {
                success: true,
                active: false,
                message: 'No active auto workflow running'
            };
        }
        return {
            success: true,
            active: true,
            message: '📊 Auto Workflow Status',
            data: {
                issue: state.issue,
                progress: {
                    current: state.currentAC,
                    total: state.totalACs,
                    percentage: Math.round((state.currentAC / state.totalACs) * 100)
                },
                currentPhase: state.currentPhase,
                status: state.status,
                created: state.createdAt,
                updated: state.updatedAt
            },
            details: [
                `Issue: #${state.issue}`,
                `Progress: ${state.currentAC}/${state.totalACs} acceptance criteria`,
                `Current phase: ${state.currentPhase}`,
                `Status: ${state.status}`,
                `Created: ${new Date(state.createdAt).toLocaleString()}`,
                `Updated: ${new Date(state.updatedAt).toLocaleString()}`
            ]
        };
    }
}
exports.StatusCommandHandler = StatusCommandHandler;
class ParseOnlyCommandHandler {
    canHandle(options) {
        return !!options.parseOnly;
    }
    async execute(issueNumber, _options) {
        try {
            const issueData = fetchGitHubIssue(issueNumber.toString(), 'body');
            const issueBody = issueData.body;
            const criteria = (0, acceptance_criteria_parser_1.parseAcceptanceCriteria)(issueBody);
            return {
                success: true,
                command: 'parse-only',
                data: {
                    issue: issueNumber,
                    criteriaCount: criteria.length,
                    criteria: criteria
                },
                message: criteria.length === 0 ? 'No acceptance criteria found' : `Found ${criteria.length} acceptance criteria`,
                details: criteria.length === 0 ? ['Found 0 criteria'] : [`Found ${criteria.length} acceptance criteria`, `Criteria count: ${criteria.length}`]
            };
        }
        catch (parseError) {
            const message = parseError instanceof Error ? parseError.message : 'Unknown error';
            return {
                success: false,
                message: 'Parse failed',
                error: `Failed to parse issue: ${message}`
            };
        }
    }
}
exports.ParseOnlyCommandHandler = ParseOnlyCommandHandler;
class InitSessionCommandHandler {
    canHandle(options) {
        return !!options.initSession;
    }
    async execute(issueNumber, _options) {
        try {
            const details = [
                `Initializing TDD session for issue #${issueNumber}`,
                `TDD session started for issue #${issueNumber}`,
                'Using existing tdd start integration',
                'Session initialized successfully',
                'Ready to begin autonomous workflow'
            ];
            // Execute ./tdd start command from WorkFlo root directory
            if (process.env['NODE_ENV'] !== 'test') {
                (0, child_process_1.execSync)(`./tdd start ${issueNumber}`, {
                    cwd: path.resolve(process.cwd(), '..'),
                    stdio: 'inherit'
                });
            }
            return {
                success: true,
                command: 'init-session',
                data: { issue: issueNumber },
                message: `TDD session initialized for issue #${issueNumber}`,
                details
            };
        }
        catch (initError) {
            const message = initError instanceof Error ? initError.message : 'Unknown error';
            return {
                success: false,
                message: 'TDD initialization failed',
                error: `Failed to initialize TDD session: ${message}`
            };
        }
    }
}
exports.InitSessionCommandHandler = InitSessionCommandHandler;
class CommandRouter {
    constructor() {
        Object.defineProperty(this, "handlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                new StatusCommandHandler(),
                new ParseOnlyCommandHandler(),
                new InitSessionCommandHandler()
            ]
        });
    }
    async route(issueNumber, options) {
        // Find the first handler that can handle this command
        const handler = this.handlers.find(h => h.canHandle(options));
        if (!handler) {
            return {
                success: false,
                message: 'Command not handled',
                error: 'No handler found for the provided options'
            };
        }
        return await handler.execute(issueNumber, options);
    }
}
exports.CommandRouter = CommandRouter;
//# sourceMappingURL=command-handlers.js.map