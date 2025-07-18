using System.CommandLine;
using System.Diagnostics;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;

namespace WorkFlo.Cli.Commands;

public class ValidateCommand
{
    private readonly ICommitValidationService _validationService;
    
    public ValidateCommand()
    {
        _validationService = new CommitValidationService();
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

        command.SetHandler(async (string hookType, string? commitMsgFile) =>
        {
            var exitCode = await HandleAsync(hookType, commitMsgFile).ConfigureAwait(false);
            Environment.Exit(exitCode);
        }, hookTypeArg, commitMsgFileArg);

        return command;
    }

    private async Task<int> HandleAsync(string hookType, string? commitMsgFile)
    {
        try
        {
            switch (hookType.ToLowerInvariant())
            {
                case "pre-commit":
                    return await ValidatePreCommit().ConfigureAwait(false);
                    
                case "commit-msg":
                    if (string.IsNullOrEmpty(commitMsgFile))
                    {
                        await Console.Error.WriteLineAsync("Error: Commit message file is required for commit-msg validation").ConfigureAwait(false);
                        return 1;
                    }
                    return await ValidateCommitMessage(commitMsgFile).ConfigureAwait(false);
                    
                default:
                    await Console.Error.WriteLineAsync($"Error: Unknown hook type '{hookType}'").ConfigureAwait(false);
                    return 1;
            }
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"Error: {ex.Message}").ConfigureAwait(false);
            return 1;
        }
    }

    private async Task<int> ValidatePreCommit()
    {
        // Get staged files
        var stagedFiles = await GetStagedFilesAsync().ConfigureAwait(false);
        
        // Get current branch
        var currentBranch = await GetCurrentBranchAsync().ConfigureAwait(false);
        
        // Validate
        var result = await _validationService.ValidatePreCommitAsync(stagedFiles, currentBranch).ConfigureAwait(false);
        
        if (result.IsFailure())
        {
            await Console.Error.WriteLineAsync($"Validation failed: {result.Error}").ConfigureAwait(false);
            return 1;
        }
        
        Console.WriteLine("✓ Pre-commit validation passed");
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
            await Console.Error.WriteLineAsync($"Validation failed: {result.Error}").ConfigureAwait(false);
            return 1;
        }
        
        Console.WriteLine("✓ Commit message validation passed");
        return 0;
    }
    
    private static async Task<string[]> GetStagedFilesAsync()
    {
        using var process = new Process();
        process.StartInfo.FileName = "git";
        process.StartInfo.Arguments = "diff --cached --name-only";
        process.StartInfo.UseShellExecute = false;
        process.StartInfo.RedirectStandardOutput = true;
        process.StartInfo.CreateNoWindow = true;
        process.Start();
        
        var output = await process.StandardOutput.ReadToEndAsync().ConfigureAwait(false);
        await process.WaitForExitAsync().ConfigureAwait(false);
        
        return output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
    }
    
    private static async Task<string> GetCurrentBranchAsync()
    {
        using var process = new Process();
        process.StartInfo.FileName = "git";
        process.StartInfo.Arguments = "branch --show-current";
        process.StartInfo.UseShellExecute = false;
        process.StartInfo.RedirectStandardOutput = true;
        process.StartInfo.CreateNoWindow = true;
        process.Start();
        
        var output = await process.StandardOutput.ReadToEndAsync().ConfigureAwait(false);
        await process.WaitForExitAsync().ConfigureAwait(false);
        
        return output.Trim();
    }
}