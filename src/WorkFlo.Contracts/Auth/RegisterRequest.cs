using System.ComponentModel.DataAnnotations;

namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Request model for user registration
/// </summary>
public sealed record RegisterRequest
{
    [Required][EmailAddress] public required string Email { get; init; }

    [Required][MinLength(8)] public required string Password { get; init; }

    [Required] public required string ConfirmPassword { get; init; }
}
