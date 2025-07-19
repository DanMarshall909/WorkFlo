using System.CommandLine;
using WorkFlo.Cli.Commands;

var rootCommand = new RootCommand("WorkFlo - AI-powered workflow enforcement for development teams");

var installCommand = new InstallCommand();
rootCommand.AddCommand(installCommand.Build());

var validateCommand = new ValidateCommand();
rootCommand.AddCommand(validateCommand.Build());

var serveCommand = new ServeCommand();
rootCommand.AddCommand(serveCommand.Build());

rootCommand.SetHandler(() =>
{
    Console.WriteLine("WorkFlo - AI-powered workflow enforcement for development teams");
    Console.WriteLine();
    Console.WriteLine("Usage: workflo [command] [options]");
    Console.WriteLine();
    Console.WriteLine("Commands:");
    Console.WriteLine("  install    Install git hooks in the current repository");
    Console.WriteLine("  validate   Validate commits against workflow rules");
    Console.WriteLine("  serve      Start the WorkFlo API server");
    Console.WriteLine();
    Console.WriteLine("Options:");
    Console.WriteLine("  --help, -h       Show help and usage information");
});

// Handle --version manually before invoking the command
if (args.Length > 0 && (args[0] == "--version" || args[0] == "-v"))
{
    Console.WriteLine("WorkFlo CLI v0.1.0");
    return 0;
}

return await rootCommand.InvokeAsync(args).ConfigureAwait(false);

