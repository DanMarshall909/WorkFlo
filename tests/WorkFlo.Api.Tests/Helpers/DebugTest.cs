using System.Net.Http.Json;
using WorkFlo.Contracts.Auth;
using FluentAssertions;
using Xunit.Abstractions;

namespace WorkFlo.Api.Tests.Helpers;

public class DebugTest : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly ITestOutputHelper _output;

    public DebugTest(TestWebApplicationFactory factory, ITestOutputHelper output)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        _output = output;
    }

    [Fact]
    public async Task Debug_OAuth_endpoint_errorAsync()
    {
        try
        {
            // Arrange
            var request = new OAuthLoginRequest
            {
                Provider = "google",
                AuthorizationCode = "test_code",
                RedirectUri = "https://localhost:3000/auth/callback",
                RememberMe = false
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);
            var responseContent = await response.Content.ReadAsStringAsync();

            // Output debugging information
            _output.WriteLine($"Status Code: {response.StatusCode}");
            _output.WriteLine($"Response Content: {responseContent}");

            // Basic assertion
            response.StatusCode.Should().NotBe(System.Net.HttpStatusCode.InternalServerError,
                $"Unexpected 500 error. Content: {responseContent}");
        }
        catch (Exception ex)
        {
            _output.WriteLine($"Exception: {ex}");
            throw;
        }
    }
}
