using FluentAssertions;
using NSubstitute;
using WorkFlo.Application.Services;
using WorkFlo.Cli.Commands;
using WorkFlo.Cli.Services;
using WorkFlo.Domain.Common;
using Xunit;

namespace WorkFlo.Cli.Tests.Commands;

public class ValidateCommandTests
{
    private readonly ICommitValidationService _validationService;
    private readonly IConsoleService _console;
    private readonly IGitService _gitService;
    private readonly ValidateCommand _validateCommand;
    
    public ValidateCommandTests()
    {
        _validationService = Substitute.For<ICommitValidationService>();
        _console = Substitute.For<IConsoleService>();
        _gitService = Substitute.For<IGitService>();
        _validateCommand = new ValidateCommand(_validationService, _console, _gitService);
    }
    
    [Fact]
    public void validate_command_accepts_hook_type_argument()
    {
        // Arrange & Act
        var command = _validateCommand.Build();
        
        // Assert
        command.Arguments.Should().Contain(a => a.Name == "hook-type");
    }
    
    [Fact]
    public void validate_command_accepts_optional_commit_msg_file_argument()
    {
        // Arrange & Act
        var command = _validateCommand.Build();
        
        // Assert
        command.Arguments.Should().Contain(a => a.Name == "commit-msg-file");
        var commitMsgArg = command.Arguments.First(a => a.Name == "commit-msg-file");
        commitMsgArg.Arity.MinimumNumberOfValues.Should().Be(0);
        commitMsgArg.Arity.MaximumNumberOfValues.Should().Be(1);
    }
}