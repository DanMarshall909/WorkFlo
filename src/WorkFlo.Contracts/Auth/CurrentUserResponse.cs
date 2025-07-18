namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Response model for current user information
/// </summary>
public sealed record CurrentUserResponse
{
    public required Guid Id { get; init; }
    public required string EmailHash { get; init; }
    public required bool EmailVerified { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required bool IsActive { get; init; }
}
