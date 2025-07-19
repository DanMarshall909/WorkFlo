using System.CommandLine;
using WorkFlo.Application.Services;
using WorkFlo.Cli.Services;
using WorkFlo.Domain.Common;
using WorkFlo.Infrastructure.Services;

namespace WorkFlo.Cli.Commands;

public class InstallCommand
{
    private readonly IHookInstallationService _hookInstallationService;
    private readonly IConsoleService _console;
    
    public InstallCommand(IHookInstallationService? hookInstallationService = null, IConsoleService? console = null)
    {
        _hookInstallationService = hookInstallationService ?? new HookInstallationService();
        _console = console ?? new ConsoleService();
    }
    
    public Command Build()
    {
        var command = new Command("install", "Install WorkFlo git hooks in the current repository");
        
        var forceOption = new Option<bool>(
            aliases: new[] { "--force", "-f" },
            description: "Overwrite existing hooks");
        command.AddOption(forceOption);

        command.SetHandler(async (bool force) =>
        {
            await HandleAsync(force).ConfigureAwait(false);
        }, forceOption);

        return command;
    }

    private async Task HandleAsync(bool force)
    {
        await _console.WriteLineAsync("Installing WorkFlo git hooks...").ConfigureAwait(false);
        
        var result = await _hookInstallationService.InstallHooksAsync(force).ConfigureAwait(false);
        
        if (result.IsFailure())
        {
            await _console.WriteErrorAsync($"✗ Installation failed: {result.Error}").ConfigureAwait(false);
            Environment.Exit(1);
            return;
        }
        
        await _console.WriteLineAsync("✓ Git hooks installed successfully!").ConfigureAwait(false);
        await _console.WriteLineAsync(string.Empty).ConfigureAwait(false);
        await _console.WriteLineAsync("WorkFlo will now enforce:").ConfigureAwait(false);
        await _console.WriteLineAsync("  • Maximum 3 files per commit").ConfigureAwait(false);
        await _console.WriteLineAsync("  • Commits only on 'dev' branch").ConfigureAwait(false);
        await _console.WriteLineAsync("  • Conventional commit messages").ConfigureAwait(false);
    }
}
