using System.Reflection;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;

namespace WorkFlo.Infrastructure.Services;

public class HookInstallationService : IHookInstallationService
{
    private const string GitHooksDirectory = ".git/hooks";
    private const string WorkFloDirectory = ".workflo";
    private const string LogsDirectory = ".workflo/logs";
    
    public async Task<Result> InstallHooksAsync(bool force = false)
    {
        // Check if we're in a git repository
        if (!Directory.Exists(".git"))
        {
            return Result.Failure("Not in a git repository. Please run this command from the root of a git repository.");
        }
        
        // Create directories
        Directory.CreateDirectory(GitHooksDirectory);
        Directory.CreateDirectory(WorkFloDirectory);
        Directory.CreateDirectory(LogsDirectory);
        
        // Install hooks
        var hooks = new[] { "pre-commit", "commit-msg" };
        
        foreach (var hookName in hooks)
        {
            var hookPath = Path.Combine(GitHooksDirectory, hookName);
            
            // Check if hook already exists
            if (File.Exists(hookPath) && !force)
            {
                return Result.Failure($"Hook '{hookName}' already exists. Use --force to overwrite.");
            }
            
            // Get hook content from templates
            var hookContent = GetHookTemplate(hookName);
            if (string.IsNullOrEmpty(hookContent))
            {
                return Result.Failure($"Hook template '{hookName}' not found.");
            }
            
            // Write hook file
            await File.WriteAllTextAsync(hookPath, hookContent).ConfigureAwait(false);
            
            // Make hook executable (Unix-like systems)
            if (!OperatingSystem.IsWindows())
            {
                await MakeExecutableAsync(hookPath).ConfigureAwait(false);
            }
        }
        
        return Result.Success();
    }
    
    public async Task<Result<bool>> AreHooksInstalledAsync()
    {
        if (!Directory.Exists(".git"))
        {
            return ResultExtensions.Failure<bool>("Not in a git repository.");
        }
        
        var hooks = new[] { "pre-commit", "commit-msg" };
        foreach (var hookName in hooks)
        {
            var hookPath = Path.Combine(GitHooksDirectory, hookName);
            if (!File.Exists(hookPath))
            {
                return ResultExtensions.Success(false);
            }
            
            // Check if it's our hook by looking for "workflo" command
            var content = await File.ReadAllTextAsync(hookPath).ConfigureAwait(false);
            if (!content.Contains("workflo"))
            {
                return ResultExtensions.Success(false);
            }
        }
        
        return ResultExtensions.Success(true);
    }
    
    private static string GetHookTemplate(string hookName)
    {
        return hookName switch
        {
            "pre-commit" => @"#!/bin/sh
# WorkFlo pre-commit hook
# Validates staged files before commit

# Check if workflo CLI is installed
if ! command -v workflo &> /dev/null; then
    echo ""Error: WorkFlo CLI is not installed or not in PATH""
    echo ""Please install WorkFlo CLI: dotnet tool install -g WorkFlo.Cli""
    exit 1
fi

# Run WorkFlo validation for pre-commit
workflo validate pre-commit

# Exit with the validation result
exit $?",
            "commit-msg" => @"#!/bin/sh
# WorkFlo commit-msg hook
# Validates commit message format

# Check if workflo CLI is installed
if ! command -v workflo &> /dev/null; then
    echo ""Error: WorkFlo CLI is not installed or not in PATH""
    echo ""Please install WorkFlo CLI: dotnet tool install -g WorkFlo.Cli""
    exit 1
fi

# Get the commit message file path
COMMIT_MSG_FILE=""$1""

# Run WorkFlo validation for commit message
workflo validate commit-msg ""$COMMIT_MSG_FILE""

# Exit with the validation result
exit $?",
            _ => string.Empty
        };
    }
    
    private static async Task MakeExecutableAsync(string filePath)
    {
        // Use chmod command to make file executable
        using var process = new System.Diagnostics.Process();
        process.StartInfo.FileName = "chmod";
        process.StartInfo.Arguments = $"+x \"{filePath}\"";
        process.StartInfo.UseShellExecute = false;
        process.StartInfo.CreateNoWindow = true;
        process.Start();
        await process.WaitForExitAsync().ConfigureAwait(false);
    }
}