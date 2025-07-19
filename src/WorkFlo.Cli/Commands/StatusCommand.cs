using System.CommandLine;
using WorkFlo.Cli.Services;

namespace WorkFlo.Cli.Commands;

public class StatusCommand
{
    private readonly IConsoleService _console;
    
    public StatusCommand()
    {
        _console = new ConsoleService();
    }
    
    public StatusCommand(IConsoleService console)
    {
        _console = console;
    }
    
    public Command Build()
    {
        var command = new Command("status", "Show current workflow status");
        
        command.SetHandler(async () =>
        {
            await _console.WriteLineAsync("📊 WorkFlo Status").ConfigureAwait(false);
            await _console.WriteLineAsync("Not implemented yet").ConfigureAwait(false);
        });
        
        return command;
    }
}