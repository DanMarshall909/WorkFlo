using System.CommandLine;
using WorkFlo.Cli.Services;

namespace WorkFlo.Cli.Commands;

internal class CompleteCommand
{
    private readonly IConsoleService _console;
    private readonly IProcessService _process;

    public CompleteCommand()
    {
        _console = new ConsoleService();
        _process = new ProcessService();
    }

    public CompleteCommand(IConsoleService console, IProcessService process)
    {
        _console = console;
        _process = process;
    }

    public Command Build()
    {
        var command = new Command("complete", "Complete subissue and manage merge workflow");

        var issueOption = new Option<int>(
            "--issue",
            "GitHub issue number")
        { IsRequired = true };
        issueOption.AddAlias("-i");

        var subissueOption = new Option<int>(
            "--subissue",
            "Subissue number to complete")
        { IsRequired = true };
        subissueOption.AddAlias("-s");

        var skipValidationOption = new Option<bool>(
            "--skip-validation",
            "Skip test validation before completion");

        var forceOption = new Option<bool>(
            "--force",
            "Force completion even if there are warnings");
        forceOption.AddAlias("-f");

        command.AddOption(issueOption);
        command.AddOption(subissueOption);
        command.AddOption(skipValidationOption);
        command.AddOption(forceOption);

        command.SetHandler(async (int issue, int subissue, bool skipValidation, bool force) =>
        {
            await HandleAsync(issue, subissue, skipValidation, force).ConfigureAwait(false);
        }, issueOption, subissueOption, skipValidationOption, forceOption);

        return command;
    }

    public async Task HandleAsync(int issue, int subissue, bool skipValidation, bool force)
    {
        await _console.WriteLineAsync($"🏁 Completing subissue #{issue}-{subissue}...").ConfigureAwait(false);

        try
        {
            // Validate current state before completion
            if (!skipValidation)
            {
                await _console.WriteLineAsync("🔍 Validating subissue completion requirements...").ConfigureAwait(false);

                // Check if tests are passing
                ProcessResult testResult = await _process.RunAsync("dotnet", "test --verbosity quiet").ConfigureAwait(false);
                if (testResult.ExitCode != 0)
                {
                    await _console.WriteLineAsync("❌ Tests are failing. Cannot complete subissue.").ConfigureAwait(false);
                    if (!force)
                    {
                        await _console.WriteLineAsync("Use --force to complete anyway (not recommended)").ConfigureAwait(false);
                        return;
                    }
                    await _console.WriteLineAsync("⚠️ Proceeding with failing tests due to --force flag").ConfigureAwait(false);
                }
                else
                {
                    await _console.WriteLineAsync("✅ All tests passing").ConfigureAwait(false);
                }

                // Check for uncommitted changes
                ProcessResult gitStatusResult = await _process.RunAsync("git", "status --porcelain").ConfigureAwait(false);
                if (!string.IsNullOrWhiteSpace(gitStatusResult.Output))
                {
                    await _console.WriteLineAsync("❌ Uncommitted changes detected. Please commit all changes before completion.").ConfigureAwait(false);
                    if (!force)
                    {
                        return;
                    }
                    await _console.WriteLineAsync("⚠️ Proceeding with uncommitted changes due to --force flag").ConfigureAwait(false);
                }
                else
                {
                    await _console.WriteLineAsync("✅ No uncommitted changes").ConfigureAwait(false);
                }
            }

            // Run the completion script
            await _console.WriteLineAsync("🔄 Executing subissue completion workflow...").ConfigureAwait(false);
            ProcessResult result = await _process.RunAsync("./scripts/complete-subissue.sh", $"{issue} {subissue}").ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync("✅ Subissue completed successfully!").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }

                // Show next steps
                await _console.WriteLineAsync("").ConfigureAwait(false);
                await _console.WriteLineAsync("🚀 Next steps:").ConfigureAwait(false);
                await _console.WriteLineAsync($"  • Review any auto-created quality issues").ConfigureAwait(false);
                await _console.WriteLineAsync($"  • Start next subissue: workflo start -i {issue} -s {subissue + 1}").ConfigureAwait(false);
                await _console.WriteLineAsync($"  • Check feature completion: workflo status").ConfigureAwait(false);
            }
            else
            {
                await _console.WriteLineAsync($"❌ Subissue completion failed: {result.Error}").ConfigureAwait(false);

                // Provide troubleshooting guidance
                await _console.WriteLineAsync("").ConfigureAwait(false);
                await _console.WriteLineAsync("🔧 Troubleshooting:").ConfigureAwait(false);
                await _console.WriteLineAsync("  • Check that all tests pass: dotnet test").ConfigureAwait(false);
                await _console.WriteLineAsync("  • Ensure no uncommitted changes: git status").ConfigureAwait(false);
                await _console.WriteLineAsync("  • Verify GitHub CLI authentication: gh auth status").ConfigureAwait(false);
                await _console.WriteLineAsync("  • Check branch tracking: cat .workflo/branch-tracking.json").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error completing subissue: {ex.Message}").ConfigureAwait(false);
        }
    }
}
