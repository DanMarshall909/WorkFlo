using System.Text.Json;
using System.Text.Json.Serialization;
using WorkFlo.Application.Auth.Services;
using WorkFlo.Domain.Common;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// Microsoft OAuth service implementation for privacy-first authentication
/// Implements minimal data collection and secure token handling
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
public sealed class MicrosoftOAuthService : BaseOAuthService
{
    public override string ProviderName => "microsoft";

    public MicrosoftOAuthService(HttpClient httpClient, MicrosoftOAuthConfig config)
        : base(httpClient, config)
    {
    }

    protected override async Task<Result<string>> ExchangeCodeForTokenAsync(
        string authorizationCode,
        string? redirectUri,
        CancellationToken cancellationToken)
    {
        Result<string> tokenResult = await HttpClient.ExchangeCodeForTokenAsync<MicrosoftTokenResponse>(
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
        Result<MicrosoftUserInfo> userInfoResult = await HttpClient.GetUserInfoAsync<MicrosoftUserInfo>(
            Config.UserInfoEndpoint, accessToken, cancellationToken)
            .ConfigureAwait(false);

        if (!userInfoResult.IsSuccess)
        {
            return Failure<OAuthUserInfo>(userInfoResult.Error!);
        }

        MicrosoftUserInfo userInfo = userInfoResult.Value!;

        return OAuthResponseValidator.ValidateUserInfoResponse(
            userInfo,
            ProviderName,
            ConvertToOAuthUserInfo);
    }

    private OAuthUserInfo? ConvertToOAuthUserInfo(object userInfoObj)
    {
        if (userInfoObj is not MicrosoftUserInfo userInfo)
        {
            return null;
        }

        if (userInfo.Mail == null || userInfo.Id == null)
        {
            return null;
        }

        return new OAuthUserInfo
        {
            Email = userInfo.Mail,
            ProviderId = userInfo.Id,
            Provider = ProviderName,
            Name = userInfo.DisplayName,
            EmailVerified = true // Microsoft Graph API returns verified emails
        };
    }

    // Internal DTOs for Microsoft OAuth responses
    private sealed class MicrosoftTokenResponse
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

    private sealed class MicrosoftUserInfo
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("mail")]
        public string? Mail { get; set; }

        [JsonPropertyName("displayName")]
        public string? DisplayName { get; set; }

        [JsonPropertyName("givenName")]
        public string? GivenName { get; set; }

        [JsonPropertyName("surname")]
        public string? Surname { get; set; }

        [JsonPropertyName("userPrincipalName")]
        public string? UserPrincipalName { get; set; }
    }
}
