using System.CommandLine;
using WorkFlo.Cli.Services;

namespace WorkFlo.Cli.Commands;

public class CreateCommand
{
    private readonly IConsoleService _console;
    private readonly IProcessService _process;

    public CreateCommand()
    {
        _console = new ConsoleService();
        _process = new ProcessService();
    }

    public CreateCommand(IConsoleService console, IProcessService process)
    {
        _console = console;
        _process = process;
    }

    public Command Build()
    {
        var command = new Command("create", "Create various WorkFlo components and structures");

        // Subcommands for different creation types
        var branchesCommand = new Command("branches", "Create feature branch structure with AI analysis");
        var issueCommand = new Command("issue", "Create quality or technical debt issue");
        var stubsCommand = new Command("stubs", "Create test stubs for missing coverage");

        // Branches creation options
        var issueNumberOption = new Option<int>(
            "--issue",
            "GitHub issue number for branch creation") { IsRequired = true };
        issueNumberOption.AddAlias("-i");

        branchesCommand.AddOption(issueNumberOption);

        // Issue creation options
        var titleOption = new Option<string>(
            "--title",
            "Issue title") { IsRequired = true };
        titleOption.AddAlias("-t");

        var descriptionOption = new Option<string>(
            "--description",
            "Issue description") { IsRequired = true };
        descriptionOption.AddAlias("-d");

        var keywordsOption = new Option<string>(
            "--keywords",
            "Comma-separated keywords for categorization") { IsRequired = true };
        keywordsOption.AddAlias("-k");

        var forceOption = new Option<bool>(
            "--force",
            "Skip duplicate check and create anyway");
        forceOption.AddAlias("-f");

        issueCommand.AddOption(titleOption);
        issueCommand.AddOption(descriptionOption);
        issueCommand.AddOption(keywordsOption);
        issueCommand.AddOption(forceOption);

        // Test stubs options
        var testFileOption = new Option<string>(
            "--test-file",
            "Test file to add stubs to") { IsRequired = true };

        var testDescriptionsOption = new Option<string[]>(
            "--descriptions",
            "Test descriptions for stub generation") { IsRequired = true };

        stubsCommand.AddOption(testFileOption);
        stubsCommand.AddOption(testDescriptionsOption);

        // Set handlers
        branchesCommand.SetHandler(async (int issue) =>
        {
            await HandleCreateBranchesAsync(issue).ConfigureAwait(false);
        }, issueNumberOption);

        issueCommand.SetHandler(async (string title, string description, string keywords, bool force) =>
        {
            await HandleCreateIssueAsync(title, description, keywords, force).ConfigureAwait(false);
        }, titleOption, descriptionOption, keywordsOption, forceOption);

        stubsCommand.SetHandler(async (string testFile, string[] descriptions) =>
        {
            await HandleCreateStubsAsync(testFile, descriptions).ConfigureAwait(false);
        }, testFileOption, testDescriptionsOption);

        command.AddCommand(branchesCommand);
        command.AddCommand(issueCommand);
        command.AddCommand(stubsCommand);

        // Default handler shows creation options
        command.SetHandler(async () =>
        {
            await _console.WriteLineAsync("🏗️ WorkFlo Creation Tools").ConfigureAwait(false);
            await _console.WriteLineAsync("").ConfigureAwait(false);
            await _console.WriteLineAsync("Available creation types:").ConfigureAwait(false);
            await _console.WriteLineAsync("  branches    Create feature branch structure with AI-driven parallel analysis").ConfigureAwait(false);
            await _console.WriteLineAsync("  issue       Create quality or technical debt issue with duplicate prevention").ConfigureAwait(false);
            await _console.WriteLineAsync("  stubs       Create test stubs for missing test coverage").ConfigureAwait(false);
            await _console.WriteLineAsync("").ConfigureAwait(false);
            await _console.WriteLineAsync("Examples:").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo create branches --issue 123").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo create issue -t \"Fix memory leak\" -d \"Found leak in service\" -k \"performance,bug\"").ConfigureAwait(false);
            await _console.WriteLineAsync("  workflo create stubs --test-file Tests.cs --descriptions \"test1\" \"test2\"").ConfigureAwait(false);
        });

        return command;
    }

    private async Task HandleCreateBranchesAsync(int issue)
    {
        await _console.WriteLineAsync($"🌿 Creating feature branch structure for issue #{issue}...").ConfigureAwait(false);

        try
        {
            var result = await _process.RunAsync("./scripts/create-feature-branches.sh", issue.ToString()).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync("✅ Feature branch structure created successfully!").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }

                // Show next steps
                await _console.WriteLineAsync("").ConfigureAwait(false);
                await _console.WriteLineAsync("🚀 Next steps:").ConfigureAwait(false);
                await _console.WriteLineAsync($"  • Check parallel development analysis: .workflo/ai-parallel-analysis-{issue}.md").ConfigureAwait(false);
                await _console.WriteLineAsync($"  • Start subissue work: workflo start -i {issue} -s 1").ConfigureAwait(false);
                await _console.WriteLineAsync("  • Review branch structure: git branch").ConfigureAwait(false);
            }
            else
            {
                await _console.WriteLineAsync($"❌ Failed to create feature branches: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error creating feature branches: {ex.Message}").ConfigureAwait(false);
        }
    }

    private async Task HandleCreateIssueAsync(string title, string description, string keywords, bool force)
    {
        await _console.WriteLineAsync($"📝 Creating quality issue: \"{title}\"...").ConfigureAwait(false);

        try
        {
            var args = $"\"{title}\" \"{description}\" \"{keywords}\"";
            if (force)
            {
                args += " --force";
            }

            var result = await _process.RunAsync("./scripts/create-quality-issue.sh", args).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync("✅ Quality issue created successfully!").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }
            }
            else
            {
                await _console.WriteLineAsync($"❌ Failed to create quality issue: {result.Error}").ConfigureAwait(false);
                
                // If it's a duplicate issue error, provide guidance
                if (result.Error.Contains("duplicate") || result.Error.Contains("similar"))
                {
                    await _console.WriteLineAsync("").ConfigureAwait(false);
                    await _console.WriteLineAsync("💡 Tips:").ConfigureAwait(false);
                    await _console.WriteLineAsync("  • Review similar issues and update with additional context").ConfigureAwait(false);
                    await _console.WriteLineAsync("  • Use --force if this is genuinely different").ConfigureAwait(false);
                    await _console.WriteLineAsync("  • Refine title/keywords to be more specific").ConfigureAwait(false);
                }
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error creating quality issue: {ex.Message}").ConfigureAwait(false);
        }
    }

    private async Task HandleCreateStubsAsync(string testFile, string[] descriptions)
    {
        await _console.WriteLineAsync($"🧪 Creating test stubs in {testFile}...").ConfigureAwait(false);

        try
        {
            // Build arguments: test file followed by test descriptions
            var args = $"\"{testFile}\" " + string.Join(" ", descriptions.Select(d => $"\"{d}\""));

            var result = await _process.RunAsync("./scripts/add-test-stubs.sh", args).ConfigureAwait(false);

            if (result.ExitCode == 0)
            {
                await _console.WriteLineAsync($"✅ Created {descriptions.Length} test stub(s) successfully!").ConfigureAwait(false);
                if (!string.IsNullOrEmpty(result.Output))
                {
                    await _console.WriteLineAsync(result.Output).ConfigureAwait(false);
                }

                await _console.WriteLineAsync("").ConfigureAwait(false);
                await _console.WriteLineAsync("🚀 Next steps:").ConfigureAwait(false);
                await _console.WriteLineAsync("  • Implement the test stubs following TDD workflow").ConfigureAwait(false);
                await _console.WriteLineAsync("  • Use workflo tdd red/green/refactor for each test").ConfigureAwait(false);
                await _console.WriteLineAsync("  • Run tests to see failing stubs: dotnet test").ConfigureAwait(false);
            }
            else
            {
                await _console.WriteLineAsync($"❌ Failed to create test stubs: {result.Error}").ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            await _console.WriteLineAsync($"❌ Error creating test stubs: {ex.Message}").ConfigureAwait(false);
        }
    }
}