namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// Factory for creating consistent OAuth error messages
/// Centralizes error message creation for better maintainability
/// </summary>
public static class OAuthErrorFactory
{
    public static string TimeoutError(string providerName) =>
        $"Request timeout while communicating with {providerName} OAuth";

    public static string NetworkError(string providerName, string message) =>
        $"Network error during {providerName} OAuth: {message}";

    public static string UnexpectedError(string providerName, string message) =>
        $"Unexpected error during {providerName} OAuth: {message}";

    public static string TokenExchangeError(string providerName, int statusCode, string responseContent) =>
        $"Failed to exchange authorization code with {providerName}: HTTP {statusCode} - {responseContent}";

    public static string InvalidTokenResponse(string providerName) =>
        $"Invalid token response from {providerName}";

    public static string UserInfoError(string providerName, int statusCode, string responseContent) =>
        $"Failed to retrieve user information from {providerName}: HTTP {statusCode} - {responseContent}";

    public static string InvalidUserInfoResponse(string providerName) =>
        $"Invalid user info response from {providerName}";

    public static string TokenExchangeTimeout() =>
        "Token exchange request timed out";

    public static string TokenExchangeFailed(string message) =>
        $"Token exchange failed: {message}";

    public static string UserInfoRetrievalFailed(string message) =>
        $"User info retrieval failed: {message}";
}
