using WorkFlo.Application.Auth.Services;
using WorkFlo.Domain.Common;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Tests.Common.Helpers;

/// <summary>
/// Test OAuth service that doesn't make external HTTP calls
/// Used for integration testing to avoid dependency on external OAuth providers
/// </summary>
internal sealed class TestOAuthService : IOAuthService
{
    public string ProviderName { get; }

    public TestOAuthService(string providerName)
    {
        ProviderName = providerName ?? throw new ArgumentNullException(nameof(providerName));
    }

    public Task<Result<OAuthUserInfo>> AuthenticateAsync(
        string authorizationCode,
        string? redirectUri,
        CancellationToken cancellationToken = default)
    {
        // For tests, simulate different scenarios based on authorization code
        return authorizationCode switch
        {
            "test_code" => Task.FromResult(Success(new OAuthUserInfo
            {
                Email = "test@example.com",
                ProviderId = "test_user_123",
                Provider = ProviderName,
                Name = "Test User",
                EmailVerified = true
            })),
            "test_code_unverified" => Task.FromResult(Success(new OAuthUserInfo
            {
                Email = "unverified@example.com",
                ProviderId = "unverified_user_456",
                Provider = ProviderName,
                Name = "Unverified User",
                EmailVerified = false
            })),
            "test_code_that_will_timeout" => Task.FromResult(Failure<OAuthUserInfo>("Network timeout")),
            _ => Task.FromResult(Failure<OAuthUserInfo>($"Unsupported OAuth provider: {ProviderName}"))
        };
    }
}
