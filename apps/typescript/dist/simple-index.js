#!/usr/bin/env node
// Simple WorkFlo TypeScript entry point
console.log('WorkFlo TypeScript - Args:', process.argv.slice(2));
var args = process.argv.slice(2);
if (args.length === 0) {
    console.log('WorkFlo - TDD Workflow Automation');
    console.log('Usage: flo <command>');
    console.log('Commands: start, red, green, cover, refactor, status, help');
    process.exit(0);
}
var command = args[0];
switch (command) {
    case 'help':
        console.log('WorkFlo Help:');
        console.log('  start <issue>  - Start TDD session');
        console.log('  red           - RED phase');
        console.log('  green         - GREEN phase');
        console.log('  cover         - COVER phase');
        console.log('  refactor      - REFACTOR phase');
        console.log('  status        - Show status');
        break;
    case 'status':
        console.log('WorkFlo Status: TypeScript implementation active');
        break;
    default:
        console.log("Command '".concat(command, "' not implemented yet in TypeScript"));
        console.log('Available: help, status');
        process.exit(1);
}
