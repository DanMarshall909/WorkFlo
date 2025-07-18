namespace WorkFlo.Contracts.Auth;

/// <summary>
/// OAuth authentication response model
/// Contains authentication tokens and user information
/// </summary>
public sealed class OAuthLoginResponse
{
    /// <summary>
    /// JWT access token for API authentication
    /// </summary>
    public string? AccessToken { get; set; }

    /// <summary>
    /// Refresh token for token renewal
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Token expiration timestamp
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Whether this is a new user registration
    /// </summary>
    public bool IsNewUser { get; set; }

    /// <summary>
    /// User information
    /// </summary>
    public UserInfo? User { get; set; }

    /// <summary>
    /// Error message if authentication failed
    /// </summary>
    public string? Error { get; set; }

    /// <summary>
    /// User information model
    /// </summary>
    public sealed class UserInfo
    {
        public Guid Id { get; set; }
        public string? EmailHash { get; set; }
        public bool EmailVerified { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? PreferredName { get; set; }
    }
}
