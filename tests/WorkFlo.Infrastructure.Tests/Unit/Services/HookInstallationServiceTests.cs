using FluentAssertions;
using WorkFlo.Domain.Common;
using WorkFlo.Infrastructure.Services;
using Xunit;

namespace WorkFlo.Infrastructure.Tests.Unit.Services;

public class HookInstallationServiceTests : IDisposable
{
    private readonly string _testDirectory;
    private readonly HookInstallationService _service;
    
    public HookInstallationServiceTests()
    {
        _testDirectory = Path.Combine(Path.GetTempPath(), $"workflo-test-{Guid.NewGuid()}");
        Directory.CreateDirectory(_testDirectory);
        Directory.SetCurrentDirectory(_testDirectory);
        _service = new HookInstallationService();
    }
    
    [Fact]
    public async Task hook_installation_fails_outside_git_repository()
    {
        // Act
        var result = await _service.InstallHooksAsync();
        
        // Assert
        result.IsFailure().Should().BeTrue();
        result.Error.Should().Contain("Not in a git repository");
    }
    
    [Fact]
    public async Task developer_can_install_hooks_in_git_repository()
    {
        // Arrange
        Directory.CreateDirectory(Path.Combine(_testDirectory, ".git"));
        Directory.CreateDirectory(Path.Combine(_testDirectory, ".git", "hooks"));
        
        // Act
        var result = await _service.InstallHooksAsync();
        
        // Assert
        result.IsSuccess.Should().BeTrue();
        File.Exists(Path.Combine(_testDirectory, ".git", "hooks", "pre-commit")).Should().BeTrue();
        File.Exists(Path.Combine(_testDirectory, ".git", "hooks", "commit-msg")).Should().BeTrue();
        Directory.Exists(Path.Combine(_testDirectory, ".workflo")).Should().BeTrue();
        Directory.Exists(Path.Combine(_testDirectory, ".workflo", "logs")).Should().BeTrue();
    }
    
    [Fact]
    public async Task installed_hooks_call_workflo_validate_command()
    {
        // Arrange
        Directory.CreateDirectory(Path.Combine(_testDirectory, ".git"));
        Directory.CreateDirectory(Path.Combine(_testDirectory, ".git", "hooks"));
        
        // Act
        await _service.InstallHooksAsync();
        
        // Assert
        var preCommitContent = await File.ReadAllTextAsync(Path.Combine(_testDirectory, ".git", "hooks", "pre-commit"));
        preCommitContent.Should().Contain("workflo validate pre-commit");
        preCommitContent.Should().StartWith("#!/bin/sh");
        
        var commitMsgContent = await File.ReadAllTextAsync(Path.Combine(_testDirectory, ".git", "hooks", "commit-msg"));
        commitMsgContent.Should().Contain("workflo validate commit-msg");
        commitMsgContent.Should().StartWith("#!/bin/sh");
    }
    
    [Fact]
    public async Task existing_hooks_prevent_installation_without_force()
    {
        // Arrange
        Directory.CreateDirectory(Path.Combine(_testDirectory, ".git"));
        Directory.CreateDirectory(Path.Combine(_testDirectory, ".git", "hooks"));
        await File.WriteAllTextAsync(Path.Combine(_testDirectory, ".git", "hooks", "pre-commit"), "existing hook");
        
        // Act
        var result = await _service.InstallHooksAsync(force: false);
        
        // Assert
        result.IsFailure().Should().BeTrue();
        result.Error.Should().Contain("already exists");
        result.Error.Should().Contain("--force");
    }
    
    [Fact]
    public async Task force_flag_overwrites_existing_hooks()
    {
        // Arrange
        Directory.CreateDirectory(Path.Combine(_testDirectory, ".git"));
        Directory.CreateDirectory(Path.Combine(_testDirectory, ".git", "hooks"));
        await File.WriteAllTextAsync(Path.Combine(_testDirectory, ".git", "hooks", "pre-commit"), "existing hook");
        
        // Act
        var result = await _service.InstallHooksAsync(force: true);
        
        // Assert
        result.IsSuccess.Should().BeTrue();
        var content = await File.ReadAllTextAsync(Path.Combine(_testDirectory, ".git", "hooks", "pre-commit"));
        content.Should().Contain("workflo validate");
        content.Should().NotBe("existing hook");
    }
    
    public void Dispose()
    {
        if (Directory.Exists(_testDirectory))
        {
            Directory.Delete(_testDirectory, true);
        }
    }
}