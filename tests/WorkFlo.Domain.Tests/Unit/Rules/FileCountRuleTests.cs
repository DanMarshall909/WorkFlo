using FluentAssertions;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Rules;
using Xunit;

namespace WorkFlo.Domain.Tests.Unit.Rules;

public class FileCountRuleTests
{
    [Fact]
    public void developer_can_commit_three_files()
    {
        // Arrange
        var rule = new FileCountRule();
        var context = new CommitContext
        {
            StagedFiles = new[] { "file1.cs", "file2.cs", "file3.cs" }
        };

        // Act
        var result = rule.Validate(context);

        // Assert
        result.IsSuccess.Should().BeTrue();
    }
    
    [Fact]
    public void commit_blocked_when_more_than_three_files()
    {
        // Arrange
        var rule = new FileCountRule();
        var context = new CommitContext
        {
            StagedFiles = new[] { "file1.cs", "file2.cs", "file3.cs", "file4.cs" }
        };

        // Act
        var result = rule.Validate(context);

        // Assert
        result.IsFailure().Should().BeTrue();
        result.Error.Should().Contain("3 files");
    }
    
    [Fact]
    public void developer_can_commit_zero_files()
    {
        // Arrange
        var rule = new FileCountRule();
        var context = new CommitContext
        {
            StagedFiles = Array.Empty<string>()
        };

        // Act
        var result = rule.Validate(context);

        // Assert
        result.IsSuccess.Should().BeTrue();
    }
}