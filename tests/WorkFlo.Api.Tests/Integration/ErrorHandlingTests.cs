
using System.Net;
using WorkFlo.Api.Tests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace WorkFlo.Api.Tests.Integration;

[Collection("IsolatedTests")]
public sealed class ErrorHandlingTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ErrorHandlingTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task UnhandledException_Returns_InternalServerError()
    {
        // Act
        var response = await _client.GetAsync("/api/test/throw-exception");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

        var content = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        content.Should().NotBeNull();
        content!["message"].Should().Be("An unexpected error occurred.");
        content["detailed"].Should().Contain("This is a test exception");
    }
}
