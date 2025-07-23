using System.CommandLine;
using WorkFlo.Cli.Commands;

var rootCommand = new RootCommand("WorkFlo - AI-powered workflow enforcement and development assistant");

// Legacy commands (maintained for backward compatibility)
var installCommand = new InstallCommand();
rootCommand.AddCommand(installCommand.Build());

var validateCommand = new ValidateCommand();
rootCommand.AddCommand(validateCommand.Build());

var serveCommand = new ServeCommand();
rootCommand.AddCommand(serveCommand.Build());

// Enhanced workflow commands
var startCommand = new StartCommand();
rootCommand.AddCommand(startCommand.Build());

var createCommand = new CreateCommand();
rootCommand.AddCommand(createCommand.Build());

var analyzeCommand = new AnalyzeCommand();
rootCommand.AddCommand(analyzeCommand.Build());

var completeCommand = new CompleteCommand();
rootCommand.AddCommand(completeCommand.Build());

var qualityCommand = new QualityCommand();
rootCommand.AddCommand(qualityCommand.Build());

var statusCommand = new StatusCommand();
rootCommand.AddCommand(statusCommand.Build());

rootCommand.SetHandler(() =>
{
    Console.WriteLine("WorkFlo - AI-powered workflow enforcement and development assistant");
    Console.WriteLine();
    Console.WriteLine("Usage: workflo [command] [options]");
    Console.WriteLine();
    Console.WriteLine("🚀 Enhanced Workflow Commands:");
    Console.WriteLine("  start      Start work on GitHub issue with branch setup");
    Console.WriteLine("  create     Create feature branches with AI-driven parallel analysis");
    Console.WriteLine("  analyze    Run quality analysis (code, coverage, duplicates)");
    Console.WriteLine("  complete   Complete subissue and merge to feature branch");
    Console.WriteLine("  quality    Quality management and issue creation");
    Console.WriteLine("  tdd        Enhanced TDD workflow with quality gates");
    Console.WriteLine("  status     Show current work status and progress");
    Console.WriteLine();
    Console.WriteLine("🔧 Legacy Commands:");
    Console.WriteLine("  install    Install git hooks in the current repository");
    Console.WriteLine("  validate   Validate commits against workflow rules");
    Console.WriteLine("  serve      Start the WorkFlo API server");
    Console.WriteLine();
    Console.WriteLine("Options:");
    Console.WriteLine("  --help, -h       Show help and usage information");
    Console.WriteLine("  --version, -v    Show version information");
    Console.WriteLine();
    Console.WriteLine("Examples:");
    Console.WriteLine("  workflo start 123                    # Start work on issue #123");
    Console.WriteLine("  workflo analyze quality              # Run code quality analysis");
    Console.WriteLine("  workflo tdd red \"Add failing test\"   # Execute TDD RED phase");
    Console.WriteLine("  workflo complete 123 1               # Complete subissue #1 of issue #123");
});

// Handle --version manually before invoking the command
if (args.Length > 0 && (string.Equals(args[0], "--version", StringComparison.Ordinal) || string.Equals(args[0], "-v", StringComparison.Ordinal)))
{
    Console.WriteLine("WorkFlo CLI v0.1.0");
    return 0;
}

return await rootCommand.InvokeAsync(args).ConfigureAwait(false);

