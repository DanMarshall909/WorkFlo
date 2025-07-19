using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace WorkFlo.Tests.Common.Helpers;

/// <summary>
/// HTTP client test extension methods inspired by Ardalis Clean Architecture patterns
/// Provides simplified methods for common integration test scenarios
/// </summary>
internal static class HttpClientTestExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    /// <summary>
    /// POST request with JSON body and deserialize response
    /// </summary>
    public static async Task<(HttpResponseMessage Response, T? Result)> PostAndDeserializeAsync<T>(
        this HttpClient client,
        string url,
        object request) where T : class
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(url, request).ConfigureAwait(false);
        T? result = default(T);

        if (response.IsSuccessStatusCode && response.Content.Headers.ContentLength > 0)
        {
            result = await response.Content.ReadFromJsonAsync<T>(JsonOptions).ConfigureAwait(false);
        }

        return (response, result);
    }

    /// <summary>
    /// POST request expecting specific status code
    /// </summary>
    public static async Task<HttpResponseMessage> PostAndEnsureStatusAsync(
        this HttpClient client,
        string url,
        object request,
        HttpStatusCode expectedStatus)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(url, request).ConfigureAwait(false);
        response.StatusCode.Should().Be(expectedStatus,
            $"Expected {expectedStatus} but got {response.StatusCode}. Response: {await response.Content.ReadAsStringAsync().ConfigureAwait(false)}");
        return response;
    }

    /// <summary>
    /// POST request expecting BadRequest (400)
    /// </summary>
    public static Task<HttpResponseMessage> PostAndEnsureBadRequestAsync(
        this HttpClient client,
        string url,
        object request)
    {
        return client.PostAndEnsureStatusAsync(url, request, HttpStatusCode.BadRequest);
    }

    /// <summary>
    /// POST request expecting OK (200) with response deserialization
    /// </summary>
    public static async Task<T> PostAndEnsureSuccessAsync<T>(
        this HttpClient client,
        string url,
        object request) where T : class
    {
        (HttpResponseMessage response, T? result) = await client.PostAndDeserializeAsync<T>(url, request).ConfigureAwait(false);
        response.StatusCode.Should().Be(HttpStatusCode.OK,
            $"Expected OK but got {response.StatusCode}. Response: {await response.Content.ReadAsStringAsync().ConfigureAwait(false)}");
        result.Should().NotBeNull("Response should contain valid data");
        return result!;
    }

    /// <summary>
    /// GET request with response deserialization
    /// </summary>
    public static async Task<T?> GetAndDeserializeAsync<T>(
        this HttpClient client,
        string url) where T : class
    {
        HttpResponseMessage response = await client.GetAsync(url).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode || response.Content.Headers.ContentLength == 0)
        {
            return null;
        }

        return await response.Content.ReadFromJsonAsync<T>(JsonOptions).ConfigureAwait(false);
    }

    /// <summary>
    /// GET request expecting specific status code
    /// </summary>
    public static async Task<HttpResponseMessage> GetAndEnsureStatusAsync(
        this HttpClient client,
        string url,
        HttpStatusCode expectedStatus)
    {
        HttpResponseMessage response = await client.GetAsync(url).ConfigureAwait(false);
        response.StatusCode.Should().Be(expectedStatus,
            $"Expected {expectedStatus} but got {response.StatusCode}. Response: {await response.Content.ReadAsStringAsync().ConfigureAwait(false)}");
        return response;
    }

    /// <summary>
    /// GET request expecting NotFound (404)
    /// </summary>
    public static Task<HttpResponseMessage> GetAndEnsureNotFoundAsync(
        this HttpClient client,
        string url)
    {
        return client.GetAndEnsureStatusAsync(url, HttpStatusCode.NotFound);
    }
}
