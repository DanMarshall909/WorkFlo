
using System.Net;
using System.Net.Http.Json;
using WorkFlo.Api.Tests.Helpers;
using WorkFlo.Contracts.Validation;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace WorkFlo.Api.Tests.Endpoints.Validation;

[Collection("IsolatedTests")]
public sealed class PreCommitValidationEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PreCommitValidationEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task PreCommitValidation_Returns_Success_For_Valid_Request()
    {
        // Arrange
        var request = new PreCommitValidationRequest
        {
            StagedFiles = new List<string> { "file1.cs", "file2.cs" },
            CurrentBranch = "dev"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/pre-commit", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<PreCommitValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeTrue();
        content.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task developer_commits_4_plus_files()
    {
        // Arrange
        var request = new PreCommitValidationRequest
        {
            StagedFiles = new List<string> { "file1.cs", "file2.cs", "file3.cs", "file4.cs" },
            CurrentBranch = "dev"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/validation/pre-commit", request);

        // Debug: log the response if it's not OK
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Response Status: {response.StatusCode}");
            Console.WriteLine($"Response Content: {errorContent}");
        }

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<PreCommitValidationResponse>();
        content.Should().NotBeNull();
        content!.IsValid.Should().BeFalse();
        content.Errors.Should().NotBeEmpty();
        content.Errors.Should().Contain(e => e.Contains("files") || e.Contains("3"));
    }
}
