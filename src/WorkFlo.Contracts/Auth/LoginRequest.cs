using System.ComponentModel.DataAnnotations;

namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Request model for user login
/// </summary>
public sealed record LoginRequest
{
    [Required][EmailAddress] public required string Email { get; init; }

    [Required] public required string Password { get; init; }

    public bool RememberMe { get; init; } = false;
}
