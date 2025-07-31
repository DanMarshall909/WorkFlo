"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const feature_1 = require("./commands/feature");
const status_1 = require("./commands/status");
const program = new commander_1.Command();
program
    .name('flo')
    .description('Flo - Universal TDD Workflow Toolkit')
    .version('0.0.1');
program.addCommand(feature_1.featureCommand);
program.addCommand(status_1.statusCommand);
// Add a placeholder for the help command to match the old output structure
program.command('help [command]', 'Show this help message').action((command) => {
    if (command) {
        const cmd = program.commands.find(c => c.name() === command);
        if (cmd) {
            cmd.outputHelp();
        }
        else {
            console.log(`Unknown command: ${command}`);
            program.outputHelp();
        }
    }
    else {
        program.outputHelp();
    }
});
program.parse(process.argv);
