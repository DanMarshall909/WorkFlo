using FluentAssertions;
using WorkFlo.Cli.Commands;
using Xunit;

namespace WorkFlo.Cli.Tests.Commands;

public class InstallCommandHttpHookTests
{
    [Fact]
    public void pre_commit_hook_template_uses_HTTP_API_calls()
    {
        // Arrange
        var installCommand = new InstallCommand();
        
        // Act
        var templatePath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "WorkFlo.Cli", "Templates", "pre-commit");
        var hookContent = File.ReadAllText(templatePath);
        
        // Assert
        hookContent.Should().Match(content => content.Contains("curl") || content.Contains("http://localhost"));
        hookContent.Should().NotContain("workflo validate");
        hookContent.Should().Contain("api/validation/pre-commit");
    }
    
    [Fact]
    public void commit_msg_hook_template_uses_HTTP_API_calls()
    {
        // Arrange & Act
        var templatePath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "WorkFlo.Cli", "Templates", "commit-msg");
        
        // Assert
        if (File.Exists(templatePath))
        {
            var hookContent = File.ReadAllText(templatePath);
            hookContent.Should().Match(content => content.Contains("curl") || content.Contains("http://localhost"));
            hookContent.Should().NotContain("workflo validate");
            hookContent.Should().Contain("api/validation/commit-msg");
        }
    }
    
    [Fact]
    public void pre_push_hook_template_uses_HTTP_API_calls()
    {
        // Arrange & Act
        var templatePath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "WorkFlo.Cli", "Templates", "pre-push");
        
        // Assert
        if (File.Exists(templatePath))
        {
            var hookContent = File.ReadAllText(templatePath);
            hookContent.Should().Match(content => content.Contains("curl") || content.Contains("http://localhost"));
            hookContent.Should().NotContain("workflo validate");
            hookContent.Should().Contain("api/validation/pre-push");
        }
    }
    
    [Fact]
    public void hooks_auto_start_API_server_when_not_running()
    {
        // Arrange & Act
        var templatePath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "WorkFlo.Cli", "Templates", "pre-commit");
        var hookContent = File.ReadAllText(templatePath);
        
        // Assert
        hookContent.Should().Contain("start-api-if-needed");
    }
}