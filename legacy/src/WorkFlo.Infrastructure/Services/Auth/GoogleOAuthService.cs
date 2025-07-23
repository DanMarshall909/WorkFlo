using System.Text.Json;
using System.Text.Json.Serialization;
using WorkFlo.Application.Auth.Services;
using WorkFlo.Domain.Common;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// Google OAuth service implementation for privacy-first authentication
/// Implements minimal data collection and secure token handling
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
public sealed class GoogleOAuthService : BaseOAuthService
{
    public override string ProviderName => "google";

    public GoogleOAuthService(HttpClient httpClient, GoogleOAuthConfig config)
        : base(httpClient, config)
    {
    }

    protected override async Task<Result<string>> ExchangeCodeForTokenAsync(
        string authorizationCode,
        string? redirectUri,
        CancellationToken cancellationToken)
    {
        Result<string> tokenResult = await HttpClient.ExchangeCodeForTokenAsync<GoogleTokenResponse>(
            Config, authorizationCode, redirectUri, cancellationToken)
            .ConfigureAwait(false);

        if (!tokenResult.IsSuccess)
        {
            return tokenResult;
        }

        return tokenResult;
    }

    protected override async Task<Result<OAuthUserInfo>> GetUserInfoAsync(
        string accessToken,
        CancellationToken cancellationToken)
    {
        Result<GoogleUserInfo> userInfoResult = await HttpClient.GetUserInfoAsync<GoogleUserInfo>(
            Config.UserInfoEndpoint, accessToken, cancellationToken)
            .ConfigureAwait(false);

        if (!userInfoResult.IsSuccess)
        {
            return Failure<OAuthUserInfo>(userInfoResult.Error!);
        }

        GoogleUserInfo userInfo = userInfoResult.Value!;

        return OAuthResponseValidator.ValidateUserInfoResponse(
            userInfo,
            ProviderName,
            ConvertToOAuthUserInfo);
    }

    private OAuthUserInfo? ConvertToOAuthUserInfo(object userInfoObj)
    {
        if (userInfoObj is not GoogleUserInfo userInfo)
        {
            return null;
        }

        if (userInfo.Email == null || userInfo.Id == null)
        {
            return null;
        }

        return new OAuthUserInfo
        {
            Email = userInfo.Email,
            ProviderId = userInfo.Id,
            Provider = ProviderName,
            Name = userInfo.Name,
            EmailVerified = userInfo.VerifiedEmail ?? false
        };
    }

    // Internal DTOs for Google OAuth responses
    private sealed class GoogleTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }

        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }

        [JsonPropertyName("expires_in")]
        public int? ExpiresIn { get; set; }

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("scope")]
        public string? Scope { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }

        [JsonPropertyName("error_description")]
        public string? ErrorDescription { get; set; }
    }

    private sealed class GoogleUserInfo
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("verified_email")]
        public bool? VerifiedEmail { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("given_name")]
        public string? GivenName { get; set; }

        [JsonPropertyName("family_name")]
        public string? FamilyName { get; set; }

        [JsonPropertyName("picture")]
        public string? Picture { get; set; }
    }
}
