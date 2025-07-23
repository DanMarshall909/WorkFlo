using System.ComponentModel.DataAnnotations;

namespace WorkFlo.Contracts.Auth;

/// <summary>
/// OAuth authentication request model
/// Supports Google and Microsoft OAuth providers
/// </summary>
public sealed class OAuthLoginRequest
{
    /// <summary>
    /// OAuth provider name (google, microsoft)
    /// </summary>
    [Required]
    [StringLength(20, MinimumLength = 1)]
    public required string Provider { get; init; }

    /// <summary>
    /// Authorization code from OAuth provider
    /// </summary>
    [Required]
    [StringLength(2048, MinimumLength = 1)]
    public required string AuthorizationCode { get; init; }

    /// <summary>
    /// OAuth redirect URI (optional)
    /// </summary>
    [StringLength(512)]
    public string? RedirectUri { get; init; }

    /// <summary>
    /// Whether to generate long-lived refresh token
    /// </summary>
    public bool RememberMe { get; init; }
}
