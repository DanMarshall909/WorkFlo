using WorkFlo.Application.Auth.Services;

namespace WorkFlo.Tests.Common.Helpers;

/// <summary>
/// Test implementation of JWT token service that doesn't require actual JWT configuration
/// </summary>
internal sealed class TestJwtTokenService : IJwtTokenService
{
    public Task<string> GenerateAccessTokenAsync(Guid userId, string emailHash, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"test-access-token-{userId}");
    }

    public Task<string> GenerateRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"test-refresh-token-{userId}-{Guid.NewGuid()}");
    }

    public Task<bool> ValidateTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(token.StartsWith("test-access-token-", StringComparison.Ordinal));
    }

    public Task<Guid?> GetUserIdFromTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        if (token.StartsWith("test-access-token-", StringComparison.Ordinal))
        {
            string guidPart = token.Replace("test-access-token-", "");
            if (Guid.TryParse(guidPart, out Guid userId))
            {
                return Task.FromResult<Guid?>(userId);
            }
        }
        return Task.FromResult<Guid?>(null);
    }

    public Task<bool> ValidateRefreshTokenAsync(string refreshToken, Guid userId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(refreshToken.Contains($"test-refresh-token-{userId}"));
    }

    public Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public DateTime GetTokenExpiryTime(bool isRememberMe = false)
    {
        return DateTime.UtcNow.AddHours(isRememberMe ? 24 : 1);
    }
}
