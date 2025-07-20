using System.CommandLine;
using WorkFlo.Cli.Services;
using WorkFlo.Application.Services;

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
        // If port is default value (5000), try to get from configuration
        int actualPort = port;
        if (port == 5000)
        {
            try
            {
                var configService = new ConfigurationService();
                var apiConfigResult = await configService.GetApiSettingsAsync().ConfigureAwait(false);
                if (apiConfigResult.IsSuccess)
                {
                    actualPort = apiConfigResult.Value!.Port;
                    await _console.WriteLineAsync($"Using port {actualPort} from configuration").ConfigureAwait(false);
                }
            }
            catch
            {
                // If config fails, fall back to command line port
                await _console.WriteLineAsync("Configuration unavailable, using command line port").ConfigureAwait(false);
            }
        }

        await _console.WriteLineAsync($"Starting WorkFlo API server on port {actualPort}...").ConfigureAwait(false);
        
        var apiPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "WorkFlo.Api", "bin", "Debug", "net9.0", "WorkFlo.Api.dll");
        if (!File.Exists(apiPath))
        {
            apiPath = Path.Combine(AppContext.BaseDirectory, "WorkFlo.Api.dll");
        }
        
        var args = $"exec \"{apiPath}\" --urls=http://localhost:{actualPort}";
        
        var result = await _process.RunAsync("dotnet", args).ConfigureAwait(false);
        
        if (result.ExitCode != 0)
        {
            await _console.WriteLineAsync($"Failed to start API server: {result.Error}").ConfigureAwait(false);
        }
    }
}