using WorkFlo.Application.Auth.Services;
using WorkFlo.Domain.Common;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// Base implementation for OAuth services
/// Provides common authentication flow and error handling
/// Uses template method pattern for provider-specific operations
/// </summary>
public abstract class BaseOAuthService : IOAuthService
{
    protected readonly OAuthHttpClient HttpClient;
    protected readonly IOAuthConfig Config;

    public abstract string ProviderName { get; }

    protected BaseOAuthService(HttpClient httpClient, IOAuthConfig config)
    {
        HttpClient = new OAuthHttpClient(httpClient ?? throw new ArgumentNullException(nameof(httpClient)));
        Config = config ?? throw new ArgumentNullException(nameof(config));
    }

    public async Task<Result<OAuthUserInfo>> AuthenticateAsync(
        string authorizationCode,
        string? redirectUri,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(authorizationCode);

        try
        {
            // Exchange authorization code for access token
            Result<string> tokenResult = await ExchangeCodeForTokenAsync(authorizationCode, redirectUri, cancellationToken)
                .ConfigureAwait(false);

            if (!tokenResult.IsSuccess)
            {
                return Failure<OAuthUserInfo>(tokenResult.Error!);
            }

            string accessToken = tokenResult.Value!;

            // Get user information
            Result<OAuthUserInfo> userInfoResult = await GetUserInfoAsync(accessToken, cancellationToken)
                .ConfigureAwait(false);

            if (!userInfoResult.IsSuccess)
            {
                return Failure<OAuthUserInfo>(userInfoResult.Error!);
            }

            return Success(userInfoResult.Value!);
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            return Failure<OAuthUserInfo>(OAuthErrorFactory.TimeoutError(ProviderName));
        }
        catch (HttpRequestException ex)
        {
            return Failure<OAuthUserInfo>(OAuthErrorFactory.NetworkError(ProviderName, ex.Message));
        }
        catch (Exception ex)
        {
            return Failure<OAuthUserInfo>(OAuthErrorFactory.UnexpectedError(ProviderName, ex.Message));
        }
    }

    /// <summary>
    /// Template method for token exchange - must be implemented by derived classes
    /// </summary>
    protected abstract Task<Result<string>> ExchangeCodeForTokenAsync(
        string authorizationCode,
        string? redirectUri,
        CancellationToken cancellationToken);

    /// <summary>
    /// Template method for user info retrieval - must be implemented by derived classes
    /// </summary>
    protected abstract Task<Result<OAuthUserInfo>> GetUserInfoAsync(
        string accessToken,
        CancellationToken cancellationToken);

    public override string ToString()
    {
        // Privacy-compliant string representation - no sensitive data
        return $"{GetType().Name}(Provider={ProviderName})";
    }
}
