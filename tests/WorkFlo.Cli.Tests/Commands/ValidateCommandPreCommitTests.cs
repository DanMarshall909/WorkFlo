using FluentAssertions;
using NSubstitute;
using System.CommandLine;
using System.CommandLine.IO;
using System.CommandLine.Parsing;
using WorkFlo.Application.Services;
using WorkFlo.Cli.Commands;
using WorkFlo.Cli.Services;
using WorkFlo.Domain.Common;
using Xunit;

namespace WorkFlo.Cli.Tests.Commands;

public class ValidateCommandPreCommitTests
{
    private readonly ICommitValidationService _validationService;
    private readonly IConsoleService _console;
    private readonly IGitService _gitService;
    private readonly ValidateCommand _validateCommand;
    private readonly IConsole _testConsole;
    
    public ValidateCommandPreCommitTests()
    {
        _validationService = Substitute.For<ICommitValidationService>();
        _console = Substitute.For<IConsoleService>();
        _gitService = Substitute.For<IGitService>();
        _validateCommand = new ValidateCommand(_validationService, _console, _gitService);
        _testConsole = new TestConsole();
    }
    
    [Fact]
    public async Task pre_commit_validation_passes_with_valid_commit()
    {
        // Arrange
        var stagedFiles = new[] { "file1.txt", "file2.txt" };
        var currentBranch = "dev";
        
        _gitService.GetStagedFilesAsync().Returns(Task.FromResult(stagedFiles));
        _gitService.GetCurrentBranchAsync().Returns(Task.FromResult(currentBranch));
        _validationService.ValidatePreCommitAsync(stagedFiles, currentBranch)
            .Returns(Task.FromResult(Result.Success()));
        
        var command = _validateCommand.Build();
        
        // Act
        var result = await command.InvokeAsync("pre-commit", _testConsole);
        
        // Assert
        result.Should().Be(0);
        await _console.Received(1).WriteLineAsync("✓ Pre-commit validation passed");
    }
}