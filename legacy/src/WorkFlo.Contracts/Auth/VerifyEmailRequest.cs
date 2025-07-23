using System.ComponentModel.DataAnnotations;

namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Request for email verification
/// </summary>
public class VerifyEmailRequest
{
    /// <summary>
    /// Email verification token
    /// </summary>
    [Required]
    [StringLength(500, ErrorMessage = "Token cannot exceed 500 characters")]
    public string Token { get; set; } = string.Empty;
}
