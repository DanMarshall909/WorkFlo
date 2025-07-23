using System.Diagnostics;
using FluentAssertions;
using Xunit;

namespace WorkFlo.Cli.Tests.Integration;

public class PreCommitValidationTests : IDisposable
{
    private readonly string _testDirectory;
    
    public PreCommitValidationTests()
    {
        _testDirectory = Path.Combine(Path.GetTempPath(), $"workflo-test-{Guid.NewGuid()}");
        Directory.CreateDirectory(_testDirectory);
        Directory.SetCurrentDirectory(_testDirectory);
        
        // Initialize git repository
        RunGitCommand("init").Wait();
        RunGitCommand("config user.email \"test@example.com\"").Wait();
        RunGitCommand("config user.name \"Test User\"").Wait();
    }
    
    [Fact]
    public async Task pre_commit_hook_blocks_too_many_files()
    {
        // Arrange
        await File.WriteAllTextAsync("file1.txt", "content1");
        await File.WriteAllTextAsync("file2.txt", "content2");
        await File.WriteAllTextAsync("file3.txt", "content3");
        await File.WriteAllTextAsync("file4.txt", "content4");
        
        await RunGitCommand("add .");
        
        // Act
        var exitCode = await RunWorkFloValidation("pre-commit");
        
        // Assert
        exitCode.Should().Be(1);
    }
    
    private async Task<int> RunWorkFloValidation(string hookType)
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var workfloPath = Path.GetFullPath(Path.Combine(currentDirectory, "../../../../../src/WorkFlo.Cli/bin/Debug/net9.0/WorkFlo.Cli.dll"));
        
        using var process = new Process();
        process.StartInfo.FileName = "dotnet";
        process.StartInfo.Arguments = $"\"{workfloPath}\" validate {hookType}";
        process.StartInfo.UseShellExecute = false;
        process.StartInfo.RedirectStandardOutput = true;
        process.StartInfo.RedirectStandardError = true;
        process.StartInfo.WorkingDirectory = _testDirectory;
        process.Start();
        await process.WaitForExitAsync();
        return process.ExitCode;
    }
    
    private static async Task RunGitCommand(string command)
    {
        using var process = new Process();
        process.StartInfo.FileName = "git";
        process.StartInfo.Arguments = command;
        process.StartInfo.UseShellExecute = false;
        process.StartInfo.CreateNoWindow = true;
        process.Start();
        await process.WaitForExitAsync();
    }
    
    public void Dispose()
    {
        if (Directory.Exists(_testDirectory))
        {
            Directory.Delete(_testDirectory, true);
        }
    }
}