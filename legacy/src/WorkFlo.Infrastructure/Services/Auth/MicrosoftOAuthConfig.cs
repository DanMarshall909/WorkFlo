namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// Configuration for Microsoft OAuth provider
/// </summary>
public sealed class MicrosoftOAuthConfig : IOAuthConfig
{
    public required string ClientId { get; init; }
    public required string ClientSecret { get; init; }
    public required string TokenEndpoint { get; init; }
    public required string UserInfoEndpoint { get; init; }
    public string? Scope { get; init; }
}
