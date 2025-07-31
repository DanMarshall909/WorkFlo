"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = void 0;
const commander_1 = require("commander");
exports.statusCommand = new commander_1.Command();
exports.statusCommand
    .name('status')
    .description('Show current TDD session status')
    .action(() => {
    console.log("No active TDD session");
    console.log("Start with: flo start <issue_number>");
});
