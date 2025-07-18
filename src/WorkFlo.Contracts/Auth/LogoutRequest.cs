using System.ComponentModel.DataAnnotations;

namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Request model for user logout
/// </summary>
public sealed record LogoutRequest
{
    [Required] public required string RefreshToken { get; init; }
}
