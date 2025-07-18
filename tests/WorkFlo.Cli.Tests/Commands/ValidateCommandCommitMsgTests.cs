using FluentAssertions;
using NSubstitute;
using System.CommandLine;
using System.CommandLine.IO;
using WorkFlo.Application.Services;
using WorkFlo.Cli.Commands;
using WorkFlo.Cli.Services;
using WorkFlo.Domain.Common;
using Xunit;

namespace WorkFlo.Cli.Tests.Commands;

public class ValidateCommandCommitMsgTests
{
    private readonly ICommitValidationService _validationService;
    private readonly IConsoleService _console;
    private readonly IGitService _gitService;
    private readonly ValidateCommand _validateCommand;
    private readonly IConsole _testConsole;
    
    public ValidateCommandCommitMsgTests()
    {
        _validationService = Substitute.For<ICommitValidationService>();
        _console = Substitute.For<IConsoleService>();
        _gitService = Substitute.For<IGitService>();
        _validateCommand = new ValidateCommand(_validationService, _console, _gitService);
        _testConsole = new TestConsole();
    }
    
    [Fact]
    public async Task commit_msg_validation_passes_with_valid_message()
    {
        // Arrange
        var commitMsgFile = Path.Combine(Path.GetTempPath(), $"commit-{Guid.NewGuid()}.txt");
        var commitMessage = "feat: add new feature";
        await File.WriteAllTextAsync(commitMsgFile, commitMessage);
        
        try
        {
            _validationService.ValidateCommitMessageAsync(commitMessage)
                .Returns(Task.FromResult(Result.Success()));
            
            var command = _validateCommand.Build();
            
            // Act
            var result = await command.InvokeAsync($"commit-msg \"{commitMsgFile}\"", _testConsole);
            
            // Assert
            result.Should().Be(0);
            await _console.Received(1).WriteLineAsync("✓ Commit message validation passed");
        }
        finally
        {
            if (File.Exists(commitMsgFile))
            {
                File.Delete(commitMsgFile);
            }
        }
    }
}