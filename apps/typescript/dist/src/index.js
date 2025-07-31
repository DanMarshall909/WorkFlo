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
program.parse(process.argv);
