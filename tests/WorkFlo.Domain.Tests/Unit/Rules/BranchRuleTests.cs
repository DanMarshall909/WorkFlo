using FluentAssertions;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Rules;
using Xunit;

namespace WorkFlo.Domain.Tests.Unit.Rules;

public class BranchRuleTests
{
    [Fact]
    public void developer_can_commit_on_dev_branch()
    {
        // Arrange
        var rule = new BranchRule();
        var context = new CommitContext
        {
            CurrentBranch = "dev"
        };

        // Act
        var result = rule.Validate(context);

        // Assert
        result.IsSuccess.Should().BeTrue();
    }
    
    [Fact]
    public void commit_blocked_on_main_branch()
    {
        // Arrange
        var rule = new BranchRule();
        var context = new CommitContext
        {
            CurrentBranch = "main"
        };

        // Act
        var result = rule.Validate(context);

        // Assert
        result.IsFailure().Should().BeTrue();
        result.Error.Should().Contain("'dev' branch");
    }
}