using System.CommandLine;
using WorkFlo.Cli.Services;

namespace WorkFlo.Cli.Commands;

public class TddCommand
{
    private readonly IConsoleService _console;
    private readonly IProcessService _process;

    public TddCommand()
    {
        _console = new ConsoleService();
        _process = new ProcessService();
    }

    public TddCommand(IConsoleService console, IProcessService process)
    {
        _console = console;
        _process = process;
    }

    public Command Build()
    {
        var command = new Command("tdd", "Enhanced TDD workflow with integrated quality gates");

        // TDD phase commands
        var redCommand = new Command("red", "Execute RED phase - write failing test");
        var greenCommand = new Command("green", "Execute GREEN phase - make tests pass");
        var refactorCommand = new Command("refactor", "Execute REFACTOR phase - improve code quality");
        var coverCommand = new Command("cover", "Execute COVER phase - validate coverage and quality");
        var commitCommand = new Command("commit", "Execute COMMIT phase - final validation and commit");

        // Workflow management commands
        var statusCommand = new Command("status", "Check current TDD phase status");
        var autoCommand = new Command("auto", "Intelligent TDD phase detection and advancement");
        var watchCommand = new Command("watch", "Continuous test monitoring with change detection");

        // Common options
        var featureNameOption = new Option<string?>(
            "--feature",
            "Feature name for commit messages and tracking");
        featureNameOption.AddAlias("-f");

        var descriptionOption = new Option<string?>(
            "--description",
            "Description for the current phase");
        descriptionOption.AddAlias("-d");

        var enhancedOption = new Option<bool>(
            "--enhanced",
            "Use enhanced TDD cycle with integrated quality analysis");
        enhancedOption.AddAlias("-e");
        enhancedOption.SetDefaultValue(true);

        // Add options to phase commands
        foreach (var phaseCommand in new[] { redCommand, greenCommand, refactorCommand, coverCommand, commitCommand })
        {
            phaseCommand.AddOption(featureNameOption);
            phaseCommand.AddOption(descriptionOption);
            phaseCommand.AddOption(enhancedOption);
        }

        // Watch command options
        var intervalOption = new Option<int>(
            "--interval",
            "Watch interval in seconds");
        intervalOption.SetDefaultValue(10);

        watchCommand.AddOption(intervalOption);

        // Auto command options
        autoCommand.AddOption(featureNameOption);

        // Set handlers for phase commands
        redCommand.SetHandler(async (string? feature, string? description, bool enhanced) =>
        {
            await HandlePhaseAsync("RED", feature, description, enhanced).ConfigureAwait(false);
        }, featureNameOption, descriptionOption, enhancedOption);

        greenCommand.SetHandler(async (string? feature, string? description, bool enhanced) =>
        {
            await HandlePhaseAsync("GREEN", feature, description, enhanced).ConfigureAwait(false);
        }, featureNameOption, descriptionOption, enhancedOption);

        refactorCommand.SetHandler(async (string? feature, string? description, bool enhanced) =>
        {
            await HandlePhaseAsync("REFACTOR", feature, description, enhanced).ConfigureAwait(false);
        }, featureNameOption, descriptionOption, enhancedOption);

        coverCommand.SetHandler(async (string? feature, string? description, bool enhanced) =>
        {
            await HandlePhaseAsync("COVER", feature, description, enhanced).ConfigureAwait(false);
        }, featureNameOption, descriptionOption, enhancedOption);

        commitCommand.SetHandler(async (string? feature, string? description, bool enhanced) =>
        {
            await HandlePhaseAsync("COMMIT", feature, description, enhanced).ConfigureAwait(false);
        }, featureNameOption, descriptionOption, enhancedOption);

        // Set handlers for workflow commands
        statusCommand.SetHandler(async () =>
        {
            await HandleStatusAsync().ConfigureAwait(false);
        });

        autoCommand.SetHandler(async (string? feature) =>
        {
            await HandleAutoAsync(feature).ConfigureAwait(false);
        }, featureNameOption);

        watchCommand.SetHandler(async (int interval) =>
        {
            await HandleWatchAsync(interval).ConfigureAwait(false);
        }, intervalOption);

        // Add all subcommands
        command.AddCommand(redCommand);
        command.AddCommand(greenCommand);
        command.AddCommand(refactorCommand);
        command.AddCommand(coverCommand);
        command.AddCommand(commitCommand);
        command.AddCommand(statusCommand);
        command.AddCommand(autoCommand);
        command.AddCommand(watchCommand);

        // Default handler shows TDD workflow guidance
        command.SetHandler(async () =>
        {
            await _console.WriteLineAsync("🔄 WorkFlo Enhanced TDD Workflow").ConfigureAwait(false);
            await _console.WriteLineAsync("").ConfigureAwait(false);
            await _console.WriteLineAsync("TDD Phases:").ConfigureAwait(false);
            await _console.WriteLineAsync("  red        🔴 Write failing test").ConfigureAwait(false);
            await _console.WriteLineAsync("  green      🟢 Make tests pass with minimal implementation").ConfigureAwait(false);
            await _console.WriteLineAsync("  refactor   🔄 Improve code quality while maintaining tests").ConfigureAwait(false);
            await _console.WriteLineAsync("  cover      📊 Validate coverage and run quality analysis").ConfigureAwait(false);
            await _console.WriteLineAsync("  commit     💾 Final validation and feature completion").ConfigureAwait(false);
            await _console.WriteLineAsync("").ConfigureAwait(false);
            await _console.WriteLineAsync("Workflow Management:").ConfigureAwait(false);
            await _console.WriteLineAsync("  status     📋 Check current TDD phase status").ConfigureAwait(false);
            await _console.WriteLineAsync("  auto       🤖 Intelligent phase detection and advancement").ConfigureAwait(false);
            await _console.WriteLineAsync("  watch      👀 Continuous test monitoring").ConfigureAwait(false);
            await _console.WriteLineAsync("").ConfigureAwait(false);
            await _console.WriteLineAsync("Examples:").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo tdd red -f \"user-auth\" -d \"Add login validation test\"").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo tdd green -f \"user-auth\" -d \"Implement login logic\"").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo tdd auto --feature \"user-auth\"").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo tdd watch --interval 5").ConfigureAwait(false);
        });

        return command;
    }

    private async Task HandlePhaseAsync(string phase, string? feature, string? description, bool enhanced)
    {
        await _console.WriteLineAsync($"🔄 Executing TDD {phase} phase...").ConfigureAwait(false);

        try
        {
            string script;
            string args = "";

            if (enhanced)
            {
                script = "./scripts/tdd-enhanced-cycle.sh";
                args = phase;
                
                if (!string.IsNullOrEmpty(feature))
                {
                    args += $" {feature}";
                }
                
                if (!string.IsNullOrEmpty(description))
                {
                    args += $" \"{description}\"";
                }
            }
            else
            {
                // Legacy TDD script support
                script = "./scripts/tdd-auto-cycle.sh";
                if (!string.IsNullOrEmpty(feature))
                {
                    args = feature;
                }
            }

            var result = await _process.RunAsync(script, args).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync($"✅ TDD {phase} phase completed successfully").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }
            }
            else
            {
                await _console.WriteLineAsync($"❌ TDD {phase} phase failed: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error executing TDD phase: {ex.Message}").ConfigureAwait(false);
        }
    }

    private async Task HandleStatusAsync()
    {
        await _console.WriteLineAsync("📋 Checking TDD workflow status...").ConfigureAwait(false);

        try
        {
            var result = await _process.RunAsync("./scripts/tdd-auto-cycle.sh", "").ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }
            }
            else
            {
                await _console.WriteLineAsync($"❌ Failed to get TDD status: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error checking TDD status: {ex.Message}").ConfigureAwait(false);
        }
    }

    private async Task HandleAutoAsync(string? feature)
    {
        await _console.WriteLineAsync("🤖 Running intelligent TDD phase detection...").ConfigureAwait(false);

        try
        {
            var args = !string.IsNullOrEmpty(feature) ? feature : "";
            var result = await _process.RunAsync("./scripts/tdd-auto-cycle.sh", args).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync("✅ TDD auto-cycle completed successfully").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }
            }
            else
            {
                await _console.WriteLineAsync($"❌ TDD auto-cycle failed: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error running TDD auto-cycle: {ex.Message}").ConfigureAwait(false);
        }
    }

    private async Task HandleWatchAsync(int interval)
    {
        await _console.WriteLineAsync($"👀 Starting continuous test monitoring (interval: {interval}s)...").ConfigureAwait(false);
        await _console.WriteLineAsync("Press Ctrl+C to stop watching").ConfigureAwait(false);

        try
        {
            var result = await _process.RunAsync("./scripts/tdd-test-watcher.sh", $"watch {interval}").ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync("✅ Test monitoring completed").ConfigureAwait(false);
            }
            else
            {
                await _console.WriteLineAsync($"❌ Test monitoring failed: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error running test watcher: {ex.Message}").ConfigureAwait(false);
        }
    }
}