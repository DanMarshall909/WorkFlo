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
        _console.WriteLine("Installing WorkFlo git hooks...");
        
        var result = await _hookInstallationService.InstallHooksAsync(force).ConfigureAwait(false);
        
        if (result.IsFailure())
        {
            _console.WriteError($"✗ Installation failed: {result.Error}");
            Environment.Exit(1);
            return;
        }
        
        _console.WriteLine("✓ Git hooks installed successfully!");
        _console.WriteLine(string.Empty);
        _console.WriteLine("WorkFlo will now enforce:");
        _console.WriteLine("  • Maximum 3 files per commit");
        _console.WriteLine("  • Commits only on 'dev' branch");
        _console.WriteLine("  • Conventional commit messages");
    }
}