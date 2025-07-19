using System.CommandLine;
using WorkFlo.Cli.Services;

namespace WorkFlo.Cli.Commands;

public class ServeCommand
{
    private readonly IConsoleService _console;
    private readonly IProcessService _process;
    
    public ServeCommand(IConsoleService? console = null, IProcessService? process = null)
    {
        _console = console ?? new ConsoleService();
        _process = process ?? new ProcessService();
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
        
        var apiPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "WorkFlo.Api", "bin", "Debug", "net9.0", "WorkFlo.Api.dll");
        if (!File.Exists(apiPath))
        {
            apiPath = Path.Combine(AppContext.BaseDirectory, "WorkFlo.Api.dll");
        }
        
        var args = $"exec \"{apiPath}\" --urls=http://localhost:{port}";
        
        var result = await _process.RunAsync("dotnet", args).ConfigureAwait(false);
        
        if (result.ExitCode != 0)
        {
            await _console.WriteLineAsync($"Failed to start API server: {result.Error}").ConfigureAwait(false);
        }
    }
}