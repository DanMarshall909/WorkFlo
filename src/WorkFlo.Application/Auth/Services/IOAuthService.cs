using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Auth.Services;

public interface IOAuthService
{
    string ProviderName { get; }
    Task<Result<OAuthUserInfo>> AuthenticateAsync(string authorizationCode, string? redirectUri, CancellationToken cancellationToken = default);
}

public sealed record OAuthUserInfo
{
    public required string Email { get; init; }
    public required string ProviderId { get; init; }
    public required string Provider { get; init; }
    public string? Name { get; init; }
    public bool EmailVerified { get; init; } = false;
}
