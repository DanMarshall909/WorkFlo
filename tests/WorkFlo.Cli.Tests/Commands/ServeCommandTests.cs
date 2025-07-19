using FluentAssertions;
using NSubstitute;
using WorkFlo.Cli.Commands;
using WorkFlo.Cli.Services;
using Xunit;

namespace WorkFlo.Cli.Tests.Commands;

public class ServeCommandTests
{
    private readonly IConsoleService _console;
    private readonly ServeCommand _serveCommand;
    
    public ServeCommandTests()
    {
        _console = Substitute.For<IConsoleService>();
        _serveCommand = new ServeCommand(_console);
    }
    
    [Fact]
    public void user_starts_API_server_on_default_port()
    {
        // Arrange & Act
        var command = _serveCommand.Build();
        
        // Assert
        command.Name.Should().Be("serve");
        command.Description.Should().Contain("Start the WorkFlo API server");
    }
    
    [Fact]
    public void user_starts_API_server_on_custom_port()
    {
        // Arrange & Act
        var command = _serveCommand.Build();
        
        // Assert
        command.Options.Should().Contain(o => o.Name == "port");
        var portOption = command.Options.First(o => o.Name == "port");
        portOption.Description.Should().Contain("port");
        portOption.IsRequired.Should().BeFalse();
    }
}