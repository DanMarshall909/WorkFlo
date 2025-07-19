using System.CommandLine;
using System.CommandLine.IO;
using FluentAssertions;
using NSubstitute;
using WorkFlo.Cli.Commands;
using WorkFlo.Cli.Services;
using Xunit;

namespace WorkFlo.Cli.Tests.Commands;

public class ServeCommandTests
{
    private readonly IConsoleService _console;
    private readonly IProcessService _process;
    private readonly ServeCommand _serveCommand;
    
    public ServeCommandTests()
    {
        _console = Substitute.For<IConsoleService>();
        _process = Substitute.For<IProcessService>();
        _serveCommand = new ServeCommand(_console, _process);
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
    
    [Fact]
    public async Task serve_command_starts_API_server_process()
    {
        // Arrange
        var command = _serveCommand.Build();
        var console = new TestConsole();
        var port = 5000;
        
        _process.RunAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(new ProcessResult { ExitCode = 0 }));
        
        // Act
        await command.InvokeAsync($"--port {port}", console);
        
        // Assert
        await _console.Received(1).WriteLineAsync(Arg.Is<string>(s => s.Contains("Starting WorkFlo API server")));
        await _process.Received(1).RunAsync(
            Arg.Is<string>(s => s.Contains("dotnet")),
            Arg.Is<string>(s => s.Contains("WorkFlo.Api.dll") && s.Contains($"--urls=http://localhost:{port}")),
            Arg.Any<CancellationToken>()
        );
    }
}