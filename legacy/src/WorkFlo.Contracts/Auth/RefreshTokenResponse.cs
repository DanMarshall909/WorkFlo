namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Response model for token refresh operations
/// </summary>
public sealed record RefreshTokenResponse
{
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
    public required DateTime ExpiresAt { get; init; }
}
