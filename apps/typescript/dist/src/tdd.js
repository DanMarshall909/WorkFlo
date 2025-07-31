#!/usr/bin/env node
"use strict";
// Functional TDD application entry point
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const logger = __importStar(require("./core/logger"));
const tdd_commands_1 = require("./commands/tdd-commands");
// Create application context
const createContext = () => ({
    configFile: '.workflo-config',
    stateFile: '.tdd-state',
    scoreFile: '.tdd-scores',
    debug: process.env.TDD_DEBUG === '1',
    verbose: process.env.TDD_VERBOSE === '1'
});
// Command registry
const commands = {
    start: tdd_commands_1.startCommand,
    red: tdd_commands_1.redCommand,
    green: tdd_commands_1.greenCommand,
    refactor: tdd_commands_1.refactorCommand,
    cover: tdd_commands_1.coverCommand,
    next: tdd_commands_1.nextCommand,
    status: tdd_commands_1.statusCommand
};
// Help text
const showHelp = () => {
    console.log('Ultra-Minimal TDD Command for Acceptance Criteria');
    console.log('');
    console.log('Usage: tdd {start|red|green|refactor|cover|next|status|help}');
    console.log('');
    console.log('Commands:');
    console.log('  start ISSUE  Start TDD workflow for GitHub issue');
    console.log('  red          Write failing test (RED phase)');
    console.log('  green        Minimal implementation (GREEN phase)');
    console.log('  refactor     Improve code quality (REFACTOR phase)');
    console.log('  cover        Add comprehensive tests (COVER phase)');
    console.log('  next         Move to next criteria (HARD STOP)');
    console.log('  status       Show current TDD session status');
    console.log('  help         Show this help message');
    console.log('');
    console.log('TDD Cycle: RED → GREEN → REFACTOR → COVER → NEXT (repeat)');
    console.log('');
    console.log('Constraints:');
    console.log('  • Work on ONE acceptance criteria at a time');
    console.log('  • Hard stops between criteria prevent scope creep');
    console.log('  • Must follow phase sequence (no skipping)');
    console.log('  • Auto-commits each phase, auto-updates board');
    console.log('  • Auto-completes issue when all criteria done');
    console.log('');
    console.log('Self-Contained Workflow:');
    console.log('  • No manual git/gh commands needed');
    console.log('  • Board management handled automatically');
    console.log('  • Focus only on writing tests and code');
};
// Main application function
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const context = createContext();
    const args = process.argv.slice(2);
    if (args.length === 0) {
        showHelp();
        process.exit(0);
    }
    const commandName = args[0];
    const commandArgs = args.slice(1);
    // Handle help command
    if (commandName === 'help' || commandName === '--help' || commandName === '-h') {
        showHelp();
        process.exit(0);
    }
    // Find and execute command
    const command = commands[commandName];
    if (!command) {
        logger.error(`Unknown command: ${commandName}. Use 'tdd help' for usage information`);
    }
    try {
        const result = yield command(commandArgs, context);
        if (!result.success) {
            logger.logError(result.error);
            process.exit(1);
        }
    }
    catch (error) {
        logger.logError(error);
        process.exit(1);
    }
});
exports.main = main;
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.logError(error);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger.logError(reason instanceof Error ? reason : new Error(String(reason)));
    process.exit(1);
});
// Run the application
if (require.main === module) {
    main().catch(error => {
        logger.logError(error);
        process.exit(1);
    });
}
