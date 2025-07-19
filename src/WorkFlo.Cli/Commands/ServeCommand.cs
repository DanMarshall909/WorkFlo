using System.CommandLine;
using WorkFlo.Cli.Services;

namespace WorkFlo.Cli.Commands;

public class ServeCommand
{
    private readonly IConsoleService _console;
    
    public ServeCommand(IConsoleService? console = null)
    {
        _console = console ?? new ConsoleService();
    }
    
    public Command Build()
    {
        var command = new Command("serve", "Start the WorkFlo API server");
        
        var portOption = new Option<int>(
            aliases: new[] { "--port", "-p" },
            getDefaultValue: () => 5000,
            description: "The port to run the API server on");
        command.AddOption(portOption);
        
        command.SetHandler(HandleAsync, portOption);
        
        return command;
    }
    
    private async Task HandleAsync(int port)
    {
        await _console.WriteLineAsync($"Starting WorkFlo API server on port {port}...").ConfigureAwait(false);
    }
}