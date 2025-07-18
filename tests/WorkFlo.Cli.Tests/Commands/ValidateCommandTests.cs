using FluentAssertions;
using WorkFlo.Cli.Commands;
using Xunit;

namespace WorkFlo.Cli.Tests.Commands;

public class ValidateCommandTests
{
    [Fact]
    public void validate_command_accepts_hook_type_argument()
    {
        // Arrange
        var validateCommand = new ValidateCommand();
        
        // Act
        var command = validateCommand.Build();
        
        // Assert
        command.Arguments.Should().Contain(a => a.Name == "hook-type");
    }
}