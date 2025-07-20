
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using WorkFlo.Api.Tests.Helpers;
using WorkFlo.Contracts.Validation;

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
    public async Task CommitMsgValidation_Returns_Success_For_Valid_MessageAsync()
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
    public async Task TDD_commit_message_validation_accepts_valid_RED_phase_formatAsync()
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
    public async Task TDD_commit_message_validation_rejects_invalid_TDD_formatAsync()
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
    [InlineData("#123 R: new-feature - Add failing test", true)]  // Starting with RED is always valid
    [InlineData("#123 INVALID_PHASE: feature - Wrong phase", false)]  // Invalid phase
    public async Task TDD_commit_message_validation_handles_phase_formatsAsync(string commitMessage, bool expectedValid)
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
    public async Task non_TDD_commit_messages_are_acceptedAsync()
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
    public async Task empty_commit_message_is_acceptedAsync()
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
    public async Task null_commit_message_is_acceptedAsync()
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

    [Fact]
    public async Task TDD_phase_transition_validation_rejects_invalid_red_to_cover_transitionAsync()
    {
        // Arrange
        // First commit with RED phase
        var firstRequest = new CommitMsgValidationRequest
        {
            CommitMessage = "#123 R: payment-processing - Add failing test for refund"
        };
        await _client.PostAsJsonAsync("/api/validation/commit-msg", firstRequest);

        // Try to jump to COVER phase (invalid transition)
        var secondRequest = new CommitMsgValidationRequest
        {
            CommitMessage = "#123 C: payment-processing - Add coverage tests"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/commit-msg", secondRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<CommitMsgValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeFalse();
        content.Errors.Should().Contain(e => e.Contains("Invalid phase transition"));
    }

    [Fact]
    public async Task full_TDD_cycle_with_valid_transitions_succeedsAsync()
    {
        // Test a complete TDD cycle with valid transitions
        var featureName = $"test-feature-{Guid.NewGuid():N}"; // Unique feature name to avoid state conflicts

        // RED phase
        var redRequest = new CommitMsgValidationRequest
        {
            CommitMessage = $"#456 R: {featureName} - Add failing test"
        };
        var redResponse = await _client.PostAsJsonAsync("/api/validation/commit-msg", redRequest);
        (await redResponse.Content.ReadFromJsonAsync<CommitMsgValidationResponse>())!.IsValid.Should().BeTrue();

        // GREEN phase
        var greenRequest = new CommitMsgValidationRequest
        {
            CommitMessage = $"#456 G: {featureName} - Make test pass"
        };
        var greenResponse = await _client.PostAsJsonAsync("/api/validation/commit-msg", greenRequest);
        (await greenResponse.Content.ReadFromJsonAsync<CommitMsgValidationResponse>())!.IsValid.Should().BeTrue();

        // REFACTOR phase
        var refactorRequest = new CommitMsgValidationRequest
        {
            CommitMessage = $"#456 REFACTOR: {featureName} - Clean up code"
        };
        var refactorResponse = await _client.PostAsJsonAsync("/api/validation/commit-msg", refactorRequest);
        (await refactorResponse.Content.ReadFromJsonAsync<CommitMsgValidationResponse>())!.IsValid.Should().BeTrue();

        // COVER phase
        var coverRequest = new CommitMsgValidationRequest
        {
            CommitMessage = $"#456 C: {featureName} - Add edge case tests"
        };
        var coverResponse = await _client.PostAsJsonAsync("/api/validation/commit-msg", coverRequest);
        (await coverResponse.Content.ReadFromJsonAsync<CommitMsgValidationResponse>())!.IsValid.Should().BeTrue();

        // MUTATION phase
        var mutationRequest = new CommitMsgValidationRequest
        {
            CommitMessage = $"#456 M: {featureName} - Add mutation tests"
        };
        var mutationResponse = await _client.PostAsJsonAsync("/api/validation/commit-msg", mutationRequest);
        (await mutationResponse.Content.ReadFromJsonAsync<CommitMsgValidationResponse>())!.IsValid.Should().BeTrue();

        // REVIEW phase
        var reviewRequest = new CommitMsgValidationRequest
        {
            CommitMessage = $"#456 REVIEW: {featureName} - Ready for review"
        };
        var reviewResponse = await _client.PostAsJsonAsync("/api/validation/commit-msg", reviewRequest);
        (await reviewResponse.Content.ReadFromJsonAsync<CommitMsgValidationResponse>())!.IsValid.Should().BeTrue();

        // DONE phase
        var doneRequest = new CommitMsgValidationRequest
        {
            CommitMessage = $"#456 DONE: {featureName} - Feature complete"
        };
        var doneResponse = await _client.PostAsJsonAsync("/api/validation/commit-msg", doneRequest);
        (await doneResponse.Content.ReadFromJsonAsync<CommitMsgValidationResponse>())!.IsValid.Should().BeTrue();
    }
}
