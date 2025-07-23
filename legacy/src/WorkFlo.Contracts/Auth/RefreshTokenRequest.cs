using System.ComponentModel.DataAnnotations;

namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Request model for token refresh
/// </summary>
public sealed record RefreshTokenRequest
{
    [Required] public required string RefreshToken { get; init; }
}
