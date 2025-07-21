using WorkFlo.Api.Mcp.Tools;
using Xunit;

namespace WorkFlo.Api.Tests.Mcp.Tools;

public class CommitValidationToolTests
{
    [Fact]
    public void ai_agent_can_validate_conventional_commit_message()
    {
        // Given: An AI agent wants to validate a commit message follows conventional commit format
        var tool = new CommitValidationTool();
        var commitMessage = "feat: add user authentication service";
        
        // When: The tool validates the commit message
        var result = tool.ValidateCommitMessage(commitMessage);
        
        // Then: The validation should pass with detailed feedback
        Assert.True(result.IsValid);
        Assert.Equal("feat", result.Type);
        Assert.Equal("add user authentication service", result.Description);
        Assert.Contains("conventional commit format", result.ValidationMessage);
    }

    [Fact]
    public void ai_agent_detects_empty_commit_message()
    {
        // Given: An AI agent encounters an empty commit message
        var tool = new CommitValidationTool();
        var emptyMessage = "";
        
        // When: The tool validates the empty message
        var result = tool.ValidateCommitMessage(emptyMessage);
        
        // Then: The validation should fail with appropriate guidance
        Assert.False(result.IsValid);
        Assert.Contains("cannot be empty", result.ValidationMessage);
    }

    [Fact]
    public void ai_agent_detects_malformed_commit_without_colon()
    {
        // Given: An AI agent encounters a commit message without proper format
        var tool = new CommitValidationTool();
        var malformedMessage = "add new feature without proper format";
        
        // When: The tool validates the malformed message
        var result = tool.ValidateCommitMessage(malformedMessage);
        
        // Then: The validation should fail with format guidance
        Assert.False(result.IsValid);
        Assert.Contains("conventional commit format", result.ValidationMessage);
        Assert.Contains("type: description", result.ValidationMessage);
    }

    [Fact]
    public void ai_agent_detects_unsupported_commit_type()
    {
        // Given: An AI agent encounters a commit with unsupported type
        var tool = new CommitValidationTool();
        var unsupportedTypeMessage = "unsupported: this type is not in the conventional list";
        
        // When: The tool validates the message with unsupported type
        var result = tool.ValidateCommitMessage(unsupportedTypeMessage);
        
        // Then: The validation should fail with valid types guidance
        Assert.False(result.IsValid);
        Assert.Equal("unsupported", result.Type);
        Assert.Equal("this type is not in the conventional list", result.Description);
        Assert.Contains("Invalid commit type", result.ValidationMessage);
        Assert.Contains("Valid types:", result.ValidationMessage);
    }
}