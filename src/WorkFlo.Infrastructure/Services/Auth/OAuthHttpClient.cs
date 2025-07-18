using System.Net.Http.Headers;
using System.Text.Json;
using WorkFlo.Domain.Common;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// HTTP client wrapper for OAuth operations
/// Centralizes HTTP request handling, error management, and response parsing
/// </summary>
public sealed class OAuthHttpClient
{
    private readonly HttpClient _httpClient;

    public OAuthHttpClient(HttpClient httpClient)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
    }

    /// <summary>
    /// Exchanges authorization code for access token
    /// </summary>
    public async Task<Result<string>> ExchangeCodeForTokenAsync<T>(
        IOAuthConfig config,
        string authorizationCode,
        string? redirectUri,
        CancellationToken cancellationToken = default)
        where T : class
    {
        var parameters = new Dictionary<string, string>
(StringComparer.Ordinal)
        {
            ["client_id"] = config.ClientId,
            ["client_secret"] = config.ClientSecret,
            ["code"] = authorizationCode,
            ["grant_type"] = "authorization_code"
        };

        if (!string.IsNullOrWhiteSpace(config.Scope))
        {
            parameters["scope"] = config.Scope;
        }

        if (!string.IsNullOrWhiteSpace(redirectUri))
        {
            parameters["redirect_uri"] = redirectUri;
        }

        var content = new FormUrlEncodedContent(parameters);

        try
        {
            HttpResponseMessage response = await _httpClient.PostAsync(config.TokenEndpoint, content, cancellationToken)
                .ConfigureAwait(false);

            string responseContent = await response.Content.ReadAsStringAsync(cancellationToken)
                .ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return Failure<string>($"Failed to exchange authorization code: HTTP {response.StatusCode} - {responseContent}");
            }

            T? tokenResponse = JsonSerializer.Deserialize<T>(responseContent);
            string? accessToken = ExtractAccessToken(tokenResponse);

            if (accessToken == null)
            {
                return Failure<string>("Invalid token response - missing access token");
            }

            return Success(accessToken);
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            return Failure<string>("Token exchange request timed out");
        }
        catch (Exception ex)
        {
            return Failure<string>($"Token exchange failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Retrieves user information using access token
    /// </summary>
    public async Task<Result<T>> GetUserInfoAsync<T>(
        string userInfoEndpoint,
        string accessToken,
        CancellationToken cancellationToken = default)
        where T : class
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, userInfoEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken)
                .ConfigureAwait(false);

            string responseContent = await response.Content.ReadAsStringAsync(cancellationToken)
                .ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return Failure<T>($"Failed to retrieve user information: HTTP {response.StatusCode} - {responseContent}");
            }

            T? userInfo = JsonSerializer.Deserialize<T>(responseContent);

            if (userInfo == null)
            {
                return Failure<T>("Invalid user info response - could not deserialize");
            }

            return Success(userInfo);
        }
        catch (Exception ex)
        {
            return Failure<T>($"User info retrieval failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Extracts access token from token response using reflection
    /// </summary>
    private static string? ExtractAccessToken(object? tokenResponse)
    {
        if (tokenResponse == null)
        {
            return null;
        }

        System.Reflection.PropertyInfo[] properties = tokenResponse.GetType().GetProperties();
        System.Reflection.PropertyInfo? accessTokenProperty = Array.Find(properties, p => p.Name.Equals("AccessToken", StringComparison.OrdinalIgnoreCase));

        return accessTokenProperty?.GetValue(tokenResponse) as string;
    }
}
