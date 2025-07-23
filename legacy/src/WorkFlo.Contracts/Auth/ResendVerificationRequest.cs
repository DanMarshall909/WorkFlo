using System.ComponentModel.DataAnnotations;

namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Request for resending email verification
/// </summary>
public class ResendVerificationRequest
{
    /// <summary>
    /// Email address to resend verification to
    /// </summary>
    [Required]
    [EmailAddress]
    [StringLength(320, ErrorMessage = "Email cannot exceed 320 characters")]
    public string Email { get; set; } = string.Empty;
}
