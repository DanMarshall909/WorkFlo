using System.CommandLine;
using WorkFlo.Cli.Services;

namespace WorkFlo.Cli.Commands;

internal sealed class AnalyzeCommand
{
    private readonly IConsoleService _console;
    private readonly IProcessService _process;

    public AnalyzeCommand()
    {
        _console = new ConsoleService();
        _process = new ProcessService();
    }

    public AnalyzeCommand(IConsoleService console, IProcessService process)
    {
        _console = console;
        _process = process;
    }

    public Command Build()
    {
        var command = new Command("analyze", "Run various analysis tools for code quality and workflow optimization");

        // Subcommands for different analysis types
        var qualityCommand = new Command("quality", "Analyze code quality and suggest improvements");
        var coverageCommand = new Command("coverage", "Analyze test coverage gaps with spike development");
        var parallelCommand = new Command("parallel", "AI-driven parallel development analysis");
        var duplicatesCommand = new Command("duplicates", "Check for duplicate issues");

        // Quality analysis options
        var autoCreateOption = new Option<bool>(
            "--auto-create",
            "Automatically create GitHub issues for quality problems");
        autoCreateOption.AddAlias("-a");

        var targetFileOption = new Option<string?>(
            "--file",
            "Analyze specific file instead of changed files");
        targetFileOption.AddAlias("-f");

        qualityCommand.AddOption(autoCreateOption);
        qualityCommand.AddOption(targetFileOption);

        // Coverage analysis options
        var issueOption = new Option<int>(
            "--issue",
            "GitHub issue number for context");
        issueOption.AddAlias("-i");

        var autoSpikesOption = new Option<bool>(
            "--auto-spikes",
            "Automatically create spike branches for coverage gaps");

        coverageCommand.AddOption(issueOption);
        coverageCommand.AddOption(autoSpikesOption);

        // Parallel analysis options
        parallelCommand.AddOption(issueOption);

        // Duplicates check options
        var titleOption = new Option<string>(
            "--title",
            "Issue title to check for duplicates")
        { IsRequired = true };

        var keywordsOption = new Option<string>(
            "--keywords",
            "Comma-separated keywords for duplicate detection")
        { IsRequired = true };

        var jsonOutputOption = new Option<bool>(
            "--json",
            "Output results in JSON format");

        duplicatesCommand.AddOption(titleOption);
        duplicatesCommand.AddOption(keywordsOption);
        duplicatesCommand.AddOption(jsonOutputOption);

        // Set handlers
        qualityCommand.SetHandler(async (bool autoCreate, string? targetFile) =>
        {
            await HandleQualityAnalysisAsync(autoCreate, targetFile).ConfigureAwait(false);
        }, autoCreateOption, targetFileOption);

        coverageCommand.SetHandler(async (int issue, bool autoSpikes) =>
        {
            await HandleCoverageAnalysisAsync(issue, autoSpikes).ConfigureAwait(false);
        }, issueOption, autoSpikesOption);

        parallelCommand.SetHandler(async (int issue) =>
        {
            await HandleParallelAnalysisAsync(issue).ConfigureAwait(false);
        }, issueOption);

        duplicatesCommand.SetHandler(async (string title, string keywords, bool json) =>
        {
            await HandleDuplicatesCheckAsync(title, keywords, json).ConfigureAwait(false);
        }, titleOption, keywordsOption, jsonOutputOption);

        command.AddCommand(qualityCommand);
        command.AddCommand(coverageCommand);
        command.AddCommand(parallelCommand);
        command.AddCommand(duplicatesCommand);

        // Default handler shows available analysis types
        command.SetHandler(async () =>
        {
            await _console.WriteLineAsync("🔍 WorkFlo Analysis Tools").ConfigureAwait(false);
            await _console.WriteLineAsync("").ConfigureAwait(false);
            await _console.WriteLineAsync("Available analysis types:").ConfigureAwait(false);
            await _console.WriteLineAsync("  quality     Code quality analysis with automatic issue creation").ConfigureAwait(false);
            await _console.WriteLineAsync("  coverage    Test coverage gap analysis with spike development").ConfigureAwait(false);
            await _console.WriteLineAsync("  parallel    AI-driven parallel development optimization").ConfigureAwait(false);
            await _console.WriteLineAsync("  duplicates  Check for duplicate GitHub issues").ConfigureAwait(false);
            await _console.WriteLineAsync("").ConfigureAwait(false);
            await _console.WriteLineAsync("Examples:").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo analyze quality --auto-create").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo analyze coverage --issue 123 --auto-spikes").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo analyze parallel --issue 123").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo analyze duplicates --title \"Fix bug\" --keywords \"bug,fix\"").ConfigureAwait(false);
        });

        return command;
    }

    private async Task HandleQualityAnalysisAsync(bool autoCreate, string? targetFile)
    {
        await _console.WriteLineAsync("🔍 Running code quality analysis...").ConfigureAwait(false);

        try
        {
            string args = autoCreate ? "--auto-create-issues" : "";
            if (!string.IsNullOrEmpty(targetFile))
            {
                args += $" --target-file {targetFile}";
            }

            ProcessResult result = await _process.RunAsync("./scripts/analyze-code-context.sh", args).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync("✅ Code quality analysis completed successfully").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }
            }
            else
            {
                await _console.WriteLineAsync($"❌ Code quality analysis failed: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error running quality analysis: {ex.Message}").ConfigureAwait(false);
        }
    }

    private async Task HandleCoverageAnalysisAsync(int issue, bool autoSpikes)
    {
        await _console.WriteLineAsync($"📊 Running coverage gap analysis for issue #{issue}...").ConfigureAwait(false);

        try
        {
            string args = issue.ToString();
            if (autoSpikes)
            {
                args += " --auto-create-spikes";
            }

            ProcessResult result = await _process.RunAsync("./scripts/analyze-coverage-gaps.sh", args).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync("✅ Coverage gap analysis completed successfully").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }
            }
            else
            {
                await _console.WriteLineAsync($"❌ Coverage gap analysis failed: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error running coverage analysis: {ex.Message}").ConfigureAwait(false);
        }
    }

    private async Task HandleParallelAnalysisAsync(int issue)
    {
        await _console.WriteLineAsync($"🤖 Running AI-driven parallel development analysis for issue #{issue}...").ConfigureAwait(false);

        try
        {
            ProcessResult result = await _process.RunAsync("./scripts/ai-parallel-analysis.sh", issue.ToString()).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync("✅ Parallel development analysis completed successfully").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }
            }
            else
            {
                await _console.WriteLineAsync($"❌ Parallel development analysis failed: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error running parallel analysis: {ex.Message}").ConfigureAwait(false);
        }
    }

    private async Task HandleDuplicatesCheckAsync(string title, string keywords, bool json)
    {
        await _console.WriteLineAsync($"🔍 Checking for duplicate issues: \"{title}\"...").ConfigureAwait(false);

        try
        {
            string args = $"\"{title}\" \"{keywords}\"";
            if (json)
            {
                args += " --json";
            }

            ProcessResult result = await _process.RunAsync("./scripts/check-duplicate-issues.sh", args).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync("✅ No duplicate issues found").ConfigureAwait(false);
            }
            else if (result.ExitCode == 1)
            {
                await _console.WriteLineAsync("⚠️ Similar issues found:").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }
            }
            else
            {
                await _console.WriteLineAsync($"❌ Duplicate check failed: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error checking duplicates: {ex.Message}").ConfigureAwait(false);
        }
    }
}
