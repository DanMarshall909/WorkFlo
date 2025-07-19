using System.CommandLine;
using WorkFlo.Cli.Services;

namespace WorkFlo.Cli.Commands;

public class StartCommand
{
    private readonly IConsoleService _console;
    private readonly IProcessService _process;

    public StartCommand()
    {
        _console = new ConsoleService();
        _process = new ProcessService();
    }

    public StartCommand(IConsoleService console, IProcessService process)
    {
        _console = console;
        _process = process;
    }

    public Command Build()
    {
        var command = new Command("start", "Start work on a GitHub issue with complete workflow setup");

        var issueOption = new Option<int?>(
            "--issue",
            "GitHub issue number to start work on");
        issueOption.AddAlias("-i");
        
        var subissueOption = new Option<int?>(
            "--subissue", 
            "Specific subissue number to start (optional)");
        subissueOption.AddAlias("-s");

        var interactiveOption = new Option<bool>(
            "--interactive",
            "Interactive issue selection mode (default)");
        interactiveOption.AddAlias("-I");
        interactiveOption.SetDefaultValue(true);

        command.AddOption(issueOption);
        command.AddOption(subissueOption);
        command.AddOption(interactiveOption);

        command.SetHandler(async (int? issue, int? subissue, bool interactive) =>
        {
            await HandleAsync(issue, subissue, interactive).ConfigureAwait(false);
        }, issueOption, subissueOption, interactiveOption);

        return command;
    }

    public async Task HandleAsync(int? issue, int? subissue, bool interactive)
    {
        await _console.WriteLineAsync("🚀 Starting WorkFlo development workflow...").ConfigureAwait(false);

        try
        {
            if (interactive && issue == null)
            {
                // Interactive mode - equivalent to ./sw
                await _console.WriteLineAsync("Starting interactive issue selection...").ConfigureAwait(false);
                var result = await _process.RunAsync("./scripts/enhanced-start-work.sh", "").ConfigureAwait(false);
                
                if (result.ExitCode != 0)
                {
                    await _console.WriteLineAsync($"❌ Interactive start failed: {result.Error}").ConfigureAwait(false);
                    return;
                }
            }
            else if (issue.HasValue)
            {
                if (subissue.HasValue)
                {
                    // Start specific subissue
                    await _console.WriteLineAsync($"Starting work on issue #{issue} subissue {subissue}...").ConfigureAwait(false);
                    var result = await _process.RunAsync("./scripts/start-subissue-work.sh", $"{issue} {subissue}").ConfigureAwait(false);
                    
                    if (result.ExitCode != 0)
                    {
                        await _console.WriteLineAsync($"❌ Failed to start subissue work: {result.Error}").ConfigureAwait(false);
                        return;
                    }
                }
                else
                {
                    // Create feature branches for issue
                    await _console.WriteLineAsync($"Creating feature branch structure for issue #{issue}...").ConfigureAwait(false);
                    var result = await _process.RunAsync("./scripts/create-feature-branches.sh", issue.ToString()).ConfigureAwait(false);
                    
                    if (result.ExitCode != 0)
                    {
                        await _console.WriteLineAsync($"❌ Failed to create feature branches: {result.Error}").ConfigureAwait(false);
                        return;
                    }
                }
            }
            else
            {
                await _console.WriteLineAsync("❌ Either use interactive mode or specify an issue number").ConfigureAwait(false);
                await _console.WriteLineAsync("Examples:").ConfigureAwait(false);
                await _console.WriteLineAsync("  workflo start                    # Interactive mode").ConfigureAwait(false);
                await _console.WriteLineAsync("  workflo start -i 123             # Create branches for issue #123").ConfigureAwait(false);
                await _console.WriteLineAsync("  workflo start -i 123 -s 1        # Start subissue #1 of issue #123").ConfigureAwait(false);
                return;
            }

            await _console.WriteLineAsync("✅ Workflow started successfully!").ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error starting workflow: {ex.Message}").ConfigureAwait(false);
        }
    }
}