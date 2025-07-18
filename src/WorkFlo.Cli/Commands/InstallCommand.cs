using System.CommandLine;
using Microsoft.Extensions.Logging;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using WorkFlo.Infrastructure.Services;

namespace WorkFlo.Cli.Commands;

public class InstallCommand
{
    private readonly IHookInstallationService _hookInstallationService;
    
    public InstallCommand()
    {
        _hookInstallationService = new HookInstallationService();
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
        Console.WriteLine("Installing WorkFlo git hooks...");
        
        var result = await _hookInstallationService.InstallHooksAsync(force).ConfigureAwait(false);
        
        if (result.IsFailure())
        {
            Console.WriteLine($"✗ Installation failed: {result.Error}");
            Environment.Exit(1);
            return;
        }
        
        Console.WriteLine("✓ Git hooks installed successfully!");
        Console.WriteLine();
        Console.WriteLine("WorkFlo will now enforce:");
        Console.WriteLine("  • Maximum 3 files per commit");
        Console.WriteLine("  • Commits only on 'dev' branch");
        Console.WriteLine("  • Conventional commit messages");
    }
}