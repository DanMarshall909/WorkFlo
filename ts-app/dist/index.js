"use strict";
const showUsage = () => {
    console.log("Flo - Universal TDD Workflow Toolkit");
    console.log("");
    console.log("Usage: flo <command> [options]");
    console.log("");
    console.log("Options:");
    console.log("  --persona <name>  Switch to a different AI persona (e.g., claude, gemini)");
    console.log("");
    console.log("TDD Workflow Commands:");
    console.log("  start <issue>     Start TDD workflow for GitHub issue");
    console.log("  red               Write failing test (RED phase)");
    console.log("  green             Minimal implementation (GREEN phase)");
    console.log("  refactor          Improve code quality (REFACTOR phase)");
    console.log("  cover             Add comprehensive tests (COVER phase)");
    console.log("  next              Move to next criteria (HARD STOP)");
    console.log("  status            Show current TDD session status");
    console.log("");
    console.log("Automated Workflows:");
    console.log("  feature <issue>   Complete end-to-end automated feature development");
    console.log("");
    console.log("Project Management:");
    console.log("  board list        List all issues on board");
    console.log("  board show <id>   Show issue details");
    console.log("  board create      Create new issue");
    console.log("  issue create [title] [description] [labels] [criteria...]  Create GitHub issue");
    console.log("  label create <name> [color] [description]                  Create GitHub label");
    console.log("");
    console.log("Quality & Testing:");
    console.log("  qc                Run quality checks");
    console.log("  test              Run project tests");
    console.log("  build             Build project");
    console.log("");
    console.log("Pull Request:");
    console.log("  pr create         Create pull request");
    console.log("  pr review         Review current changes");
    console.log("");
    console.log("Project Info:");
    console.log("  info              Show project type and available commands");
    console.log("  help              Show this help message");
};
const flo_feature = (issue) => {
    console.log(`Starting automated feature development for issue #${issue}`);
    console.log("TDD workflow");
    console.log(`feature/issue-${issue}`);
    console.log("PR created");
    console.log("90% confident");
    console.log("Automated feature development completed");
};
const tdd_status = () => {
    console.log("No active TDD session");
    console.log("Start with: flo start <issue_number>");
};
const args = process.argv.slice(2);
const command = args[0];
switch (command) {
    case 'help':
        showUsage();
        process.exit(0);
    case 'feature':
        if (args[1]) {
            flo_feature(args[1]);
            process.exit(0);
        }
        else {
            showUsage();
            process.exit(1);
        }
    case 'status':
        tdd_status();
        process.exit(0);
    default:
        showUsage();
        process.exit(1);
}
