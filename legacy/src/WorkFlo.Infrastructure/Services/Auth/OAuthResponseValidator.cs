using WorkFlo.Application.Auth.Services;
using WorkFlo.Domain.Common;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// Validator utility for OAuth responses
/// Provides consistent validation logic across different OAuth providers
/// </summary>
public static class OAuthResponseValidator
{
    /// <summary>
    /// Validates token response has required access token
    /// </summary>
    public static Result<string> ValidateTokenResponse(object? tokenResponse, string providerName)
    {
        if (tokenResponse == null)
        {
            return Failure<string>($"Invalid token response from {providerName}");
        }

        string? accessToken = ExtractAccessToken(tokenResponse);
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Failure<string>($"Invalid token response from {providerName} - missing access token");
        }

        return Success(accessToken);
    }

    /// <summary>
    /// Validates user info response and converts to OAuthUserInfo
    /// </summary>
    public static Result<OAuthUserInfo> ValidateUserInfoResponse(
        object? userInfoResponse,
        string providerName,
        Func<object, OAuthUserInfo?> converter)
    {
        if (userInfoResponse == null)
        {
            return Failure<OAuthUserInfo>($"Invalid user info response from {providerName}");
        }

        OAuthUserInfo? userInfo = converter(userInfoResponse);
        if (userInfo == null)
        {
            return Failure<OAuthUserInfo>($"Invalid user info response from {providerName} - could not convert to OAuthUserInfo");
        }

        if (string.IsNullOrWhiteSpace(userInfo.Email) || string.IsNullOrWhiteSpace(userInfo.ProviderId))
        {
            return Failure<OAuthUserInfo>($"Invalid user info response from {providerName} - missing required fields");
        }

        return Success(userInfo);
    }

    /// <summary>
    /// Extracts access token from token response using reflection
    /// </summary>
    private static string? ExtractAccessToken(object tokenResponse)
    {
        System.Reflection.PropertyInfo[] properties = tokenResponse.GetType().GetProperties();
        System.Reflection.PropertyInfo? accessTokenProperty = Array.Find(properties, p => p.Name.Equals("AccessToken", StringComparison.OrdinalIgnoreCase));

        return accessTokenProperty?.GetValue(tokenResponse) as string;
    }
}
