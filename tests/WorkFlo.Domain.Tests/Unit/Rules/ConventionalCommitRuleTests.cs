using FluentAssertions;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Rules;
using Xunit;

namespace WorkFlo.Domain.Tests.Unit.Rules;

public class ConventionalCommitRuleTests
{
    [Theory]
    [InlineData("feat: add new feature")]
    [InlineData("fix: resolve bug in login")]
    [InlineData("docs: update README")]
    [InlineData("style: format code")]
    [InlineData("refactor: improve error handling")]
    [InlineData("test: add unit tests")]
    [InlineData("chore: update dependencies")]
    public void valid_conventional_commit_messages_accepted(string commitMessage)
    {
        // Arrange
        var rule = new ConventionalCommitRule();
        var context = new CommitContext
        {
            CommitMessage = commitMessage
        };

        // Act
        var result = rule.Validate(context);

        // Assert
        result.IsSuccess.Should().BeTrue();
    }
    
    [Theory]
    [InlineData("Added new feature")]
    [InlineData("fixed bug")]
    [InlineData("FEAT: add feature")]
    [InlineData("feature: add new thing")]
    [InlineData("fix add feature")]
    [InlineData("")]
    public void invalid_commit_messages_rejected(string commitMessage)
    {
        // Arrange
        var rule = new ConventionalCommitRule();
        var context = new CommitContext
        {
            CommitMessage = commitMessage
        };

        // Act
        var result = rule.Validate(context);

        // Assert
        result.IsFailure().Should().BeTrue();
        result.Error.Should().Contain("conventional commit format");
    }
}