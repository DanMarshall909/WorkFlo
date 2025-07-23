using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Auth.Services;

/// <summary>
/// Extension methods for IOAuthService to support Uri parameters
/// </summary>
public static class OAuthServiceExtensions
{
    /// <summary>
    /// Authenticates using OAuth with Uri redirect parameter
    /// </summary>
    public static async Task<Result<OAuthUserInfo>> AuthenticateAsync(
        this IOAuthService service,
        string authorizationCode,
        Uri? redirectUri,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(service);
        return await service.AuthenticateAsync(authorizationCode, redirectUri?.ToString(), cancellationToken)
            .ConfigureAwait(false);
    }
}