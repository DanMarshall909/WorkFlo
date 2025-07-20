
using System.Net;
using System.Net.Http.Json;
using WorkFlo.Api.Tests.Helpers;
using WorkFlo.Contracts.Validation;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace WorkFlo.Api.Tests.Endpoints.Validation;

[Collection("IsolatedTests")]
public sealed class CommitMsgValidationEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public CommitMsgValidationEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task CommitMsgValidation_Returns_Success_For_Valid_Message()
    {
        // Arrange
        var request = new CommitMsgValidationRequest
        {
            CommitMessage = "feat: Add new feature"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/commit-msg", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<CommitMsgValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeTrue();
        content.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task TDD_commit_message_validation_accepts_valid_RED_phase_format()
    {
        // Arrange
        var request = new CommitMsgValidationRequest
        {
            CommitMessage = "#123 R: user-authentication - Add failing test for login"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/commit-msg", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<CommitMsgValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeTrue();
        content.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task TDD_commit_message_validation_rejects_invalid_TDD_format()
    {
        // Arrange
        var request = new CommitMsgValidationRequest
        {
            CommitMessage = "#123 INVALID: user-authentication - Wrong phase"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/commit-msg", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<CommitMsgValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeFalse();
        content.Errors.Should().NotBeEmpty();
        content.Errors.Should().Contain(e => e.Contains("Invalid TDD phase"));
    }

    [Theory]
    [InlineData("#123 G: user-authentication - Implement login handler", true)]
    [InlineData("#123 REFACTOR: user-authentication - Clean up handler code", true)]
    [InlineData("#123 C: user-authentication - Add edge case tests", true)]
    [InlineData("#123 M: user-authentication - Add mutation tests", true)]
    [InlineData("#123 REVIEW: user-authentication - Ready for review", true)]
    [InlineData("#123 DONE: user-authentication - Feature complete", true)]
    public async Task TDD_commit_message_validation_handles_all_valid_phases(string commitMessage, bool expectedValid)
    {
        // Arrange
        var request = new CommitMsgValidationRequest
        {
            CommitMessage = commitMessage
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/commit-msg", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<CommitMsgValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().Be(expectedValid);
        if (expectedValid)
        {
            content.Errors.Should().BeEmpty();
        }
    }

    [Fact]
    public async Task non_TDD_commit_messages_are_accepted()
    {
        // Arrange
        var request = new CommitMsgValidationRequest
        {
            CommitMessage = "fix: Resolve memory leak in user service"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/commit-msg", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<CommitMsgValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeTrue();
        content.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task empty_commit_message_is_accepted()
    {
        // Arrange
        var request = new CommitMsgValidationRequest
        {
            CommitMessage = ""
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/commit-msg", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<CommitMsgValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeTrue();
        content.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task null_commit_message_is_accepted()
    {
        // Arrange
        var request = new CommitMsgValidationRequest
        {
            CommitMessage = null
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/commit-msg", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<CommitMsgValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeTrue();
        content.Errors.Should().BeEmpty();
    }
}
