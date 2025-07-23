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

public class InstallCommandTests
{
    private readonly IHookInstallationService _hookInstallationService;
    private readonly IConsoleService _console;
    private readonly InstallCommand _installCommand;
    
    public InstallCommandTests()
    {
        _hookInstallationService = Substitute.For<IHookInstallationService>();
        _console = Substitute.For<IConsoleService>();
        _installCommand = new InstallCommand(_hookInstallationService, _console);
    }
    
    [Fact]
    public void install_command_has_force_option()
    {
        // Arrange & Act
        var command = _installCommand.Build();
        
        // Assert
        command.Options.Should().Contain(o => o.Aliases.Contains("--force"));
        command.Options.Should().Contain(o => o.Aliases.Contains("-f"));
    }
    
    [Fact]
    public async Task install_command_calls_hook_installation_service()
    {
        // Arrange
        _hookInstallationService.InstallHooksAsync(false)
            .Returns(Task.FromResult(Result.Success()));
        
        var command = _installCommand.Build();
        var testConsole = new TestConsole();
        
        // Act
        var result = await command.InvokeAsync("", testConsole);
        
        // Assert
        result.Should().Be(0);
        await _hookInstallationService.Received(1).InstallHooksAsync(false);
        await _console.Received(1).WriteLineAsync("Installing WorkFlo git hooks...");
        await _console.Received(1).WriteLineAsync("✓ Git hooks installed successfully!");
    }
}