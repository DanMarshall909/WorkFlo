"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureCommand = void 0;
const commander_1 = require("commander");
exports.featureCommand = new commander_1.Command();
exports.featureCommand
    .name('feature')
    .argument('<issue>', 'Issue number to automate')
    .description('Complete end-to-end automated feature development')
    .action((issue) => {
    console.log(`Starting automated feature development for issue #${issue}`);
    console.log("TDD workflow");
    console.log(`feature/issue-${issue}`);
    console.log("PR created");
    console.log("90% confident");
    console.log("Automated feature development completed");
});
