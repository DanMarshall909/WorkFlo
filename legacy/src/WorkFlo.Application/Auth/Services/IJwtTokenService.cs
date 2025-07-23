using WorkFlo.Application.Auth.Commands;

namespace WorkFlo.Application.Auth.Services;

public interface IJwtTokenService
{
    Task<string> GenerateAccessTokenAsync(Guid userId, string emailHash, CancellationToken cancellationToken = default);
    Task<string> GenerateRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<Guid?> GetUserIdFromTokenAsync(string token, CancellationToken cancellationToken = default);

    Task<bool> ValidateRefreshTokenAsync(string refreshToken, Guid userId,
        CancellationToken cancellationToken = default);

    Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    DateTime GetTokenExpiryTime(bool isRememberMe = false);
}
