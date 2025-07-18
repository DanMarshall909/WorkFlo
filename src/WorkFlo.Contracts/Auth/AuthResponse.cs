namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Response model for authentication operations
/// </summary>
public sealed record AuthResponse
{
    public string? AccessToken { get; init; }
    public string? RefreshToken { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public required UserInfo User { get; init; }

    public sealed record UserInfo
    {
        public required Guid Id { get; init; }
        public required string EmailHash { get; init; }
        public required bool EmailVerified { get; init; }
        public required DateTime CreatedAt { get; init; }
    }
}
