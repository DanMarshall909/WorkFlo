namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// Configuration interface for OAuth providers
/// Provides common configuration properties needed for OAuth authentication
/// </summary>
public interface IOAuthConfig
{
    string ClientId { get; }
    string ClientSecret { get; }
    string TokenEndpoint { get; }
    string UserInfoEndpoint { get; }
    string? Scope { get; }
}
