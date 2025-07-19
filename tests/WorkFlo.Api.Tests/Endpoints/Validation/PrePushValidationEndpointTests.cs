
using System.Net;
using System.Net.Http.Json;
using WorkFlo.Api.Tests.Helpers;
using WorkFlo.Contracts.Validation;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace WorkFlo.Api.Tests.Endpoints.Validation;

[Collection("IsolatedTests")]
public sealed class PrePushValidationEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PrePushValidationEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task PrePushValidation_Returns_Success_For_Valid_Request()
    {
        // Arrange
        var request = new PrePushValidationRequest
        {
            LocalRef = "refs/heads/main",
            LocalSha = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
            RemoteRef = "refs/heads/main",
            RemoteSha = "0b9a8f7e6d5c4b3a2e1d0c9b8a7f6e5d4c3b2a10"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/pre-push", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<PrePushValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeTrue();
        content.Errors.Should().BeEmpty();
    }
}
