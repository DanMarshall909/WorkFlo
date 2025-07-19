using System.CommandLine;
using WorkFlo.Application.Services;
using WorkFlo.Cli.Services;
using WorkFlo.Domain.Common;

namespace WorkFlo.Cli.Commands;

public class ValidateCommand
{
    private const string PreCommitHookType = "pre-commit";
    private const string CommitMsgHookType = "commit-msg";
    
    private readonly ICommitValidationService _validationService;
    private readonly IConsoleService _console;
    private readonly IGitService _gitService;
    
    public ValidateCommand(
        ICommitValidationService? validationService = null, 
        IConsoleService? console = null,
        IGitService? gitService = null)
    {
        _validationService = validationService ?? new CommitValidationService();
        _console = console ?? new ConsoleService();
        _gitService = gitService ?? new GitService();
    }
    
    public Command Build()
    {
        var command = new Command("validate", "Validate commits against workflow rules");
        
        var hookTypeArg = new Argument<string>(
            name: "hook-type",
            description: "The type of git hook (pre-commit, commit-msg)");
        command.AddArgument(hookTypeArg);

        var commitMsgFileArg = new Argument<string?>(
            "commit-msg-file",
            () => null,
            "Path to commit message file (for commit-msg hook)");
        commitMsgFileArg.Arity = ArgumentArity.ZeroOrOne;
        command.AddArgument(commitMsgFileArg);

        command.SetHandler(HandleAsync, hookTypeArg, commitMsgFileArg);

        return command;
    }

    private async Task HandleAsync(string hookType, string? commitMsgFile)
    {
        int exitCode;
        try
        {
            switch (hookType.ToLowerInvariant())
            {
                case PreCommitHookType:
                    exitCode = await ValidatePreCommit().ConfigureAwait(false);
                    break;
                    
                case CommitMsgHookType:
                    if (string.IsNullOrEmpty(commitMsgFile))
                    {
                        await _console.WriteErrorAsync("Error: Commit message file is required for commit-msg validation").ConfigureAwait(false);
                        exitCode = 1;
                        break;
                    }
                    exitCode = await ValidateCommitMessage(commitMsgFile).ConfigureAwait(false);
                    break;
                    
                default:
                    await _console.WriteErrorAsync($"Error: Unknown hook type '{hookType}'").ConfigureAwait(false);
                    exitCode = 1;
                    break;
            }
        }
        catch (Exception ex)
        {
            await _console.WriteErrorAsync($"Error: {ex.Message}").ConfigureAwait(false);
            exitCode = 1;
        }
        
        if (exitCode != 0)
        {
            Environment.Exit(exitCode);
        }
    }

    private async Task<int> ValidatePreCommit()
    {
        // Get staged files
        var stagedFiles = await _gitService.GetStagedFilesAsync().ConfigureAwait(false);
        
        // Get current branch
        var currentBranch = await _gitService.GetCurrentBranchAsync().ConfigureAwait(false);
        
        // Validate
        var result = await _validationService.ValidatePreCommitAsync(stagedFiles, currentBranch).ConfigureAwait(false);
        
        if (result.IsFailure())
        {
            await _console.WriteErrorAsync($"Validation failed: {result.Error}").ConfigureAwait(false);
            return 1;
        }
        
        await _console.WriteLineAsync("✓ Pre-commit validation passed").ConfigureAwait(false);
        return 0;
    }

    private async Task<int> ValidateCommitMessage(string commitMsgFile)
    {
        // Read commit message from file
        var commitMessage = await File.ReadAllTextAsync(commitMsgFile).ConfigureAwait(false);
        
        // Validate
        var result = await _validationService.ValidateCommitMessageAsync(commitMessage).ConfigureAwait(false);
        
        if (result.IsFailure())
        {
            await _console.WriteErrorAsync($"Validation failed: {result.Error}").ConfigureAwait(false);
            return 1;
        }
        
        await _console.WriteLineAsync("✓ Commit message validation passed").ConfigureAwait(false);
        return 0;
    }
}
