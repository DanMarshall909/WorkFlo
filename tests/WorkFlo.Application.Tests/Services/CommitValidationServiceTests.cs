using FluentAssertions;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Rules;
using Xunit;

namespace WorkFlo.Application.Tests.Services;

public class CommitValidationServiceTests
{
    private readonly CommitValidationService _service;
    
    public CommitValidationServiceTests()
    {
        _service = new CommitValidationService();
    }
    
    [Fact]
    public async Task pre_commit_validation_enforces_file_count_rule()
    {
        // Arrange
        var stagedFiles = new[] { "file1.cs", "file2.cs", "file3.cs", "file4.cs" };
        
        // Act
        var result = await _service.ValidatePreCommitAsync(stagedFiles, "dev");
        
        // Assert
        result.IsFailure().Should().BeTrue();
        result.Error.Should().Contain("Maximum 3 files allowed");
    }
    
    [Fact]
    public async Task pre_commit_validation_enforces_branch_rule()
    {
        // Arrange
        var stagedFiles = new[] { "file1.cs" };
        
        // Act
        var result = await _service.ValidatePreCommitAsync(stagedFiles, "main");
        
        // Assert
        result.IsFailure().Should().BeTrue();
        result.Error.Should().Contain("'dev' branch");
    }
    
    [Fact]
    public async Task pre_commit_validation_passes_with_valid_conditions()
    {
        // Arrange
        var stagedFiles = new[] { "file1.cs", "file2.cs" };
        
        // Act
        var result = await _service.ValidatePreCommitAsync(stagedFiles, "dev");
        
        // Assert
        result.IsSuccess.Should().BeTrue();
    }
    
    [Fact]
    public async Task commit_message_validation_enforces_conventional_format()
    {
        // Arrange
        var invalidMessage = "Added new feature";
        
        // Act
        var result = await _service.ValidateCommitMessageAsync(invalidMessage);
        
        // Assert
        result.IsFailure().Should().BeTrue();
        result.Error.Should().Contain("conventional commit format");
    }
    
    [Fact]
    public async Task commit_message_validation_passes_with_valid_format()
    {
        // Arrange
        var validMessage = "feat: add new validation feature";
        
        // Act
        var result = await _service.ValidateCommitMessageAsync(validMessage);
        
        // Assert
        result.IsSuccess.Should().BeTrue();
    }
}