using System.Security.Cryptography;
using System.Text;
using WorkFlo.Application.Auth.Services;

namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// Email hashing service for privacy-first email storage as per CLAUDE.md requirements
/// </summary>
public class EmailHashingService : IEmailHashingService
{
    private const string Salt = "WorkFlo_EmailSalt_2024"; // In production, use a configurable salt

    public string HashEmail(string email)
    {
        ArgumentException.ThrowIfNullOrEmpty(email);

        // Normalize email (lowercase, trim)
        string normalizedEmail = email.Trim().ToLowerInvariant();

        // Combine email with salt
        string saltedEmail = normalizedEmail + Salt;

        // Create SHA256 hash
        using var sha256 = SHA256.Create();
        byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedEmail));

        // Convert to base64 for storage
        return Convert.ToBase64String(hashBytes);
    }

    public bool VerifyEmail(string email, string hashedEmail)
    {
        ArgumentException.ThrowIfNullOrEmpty(email);
        ArgumentException.ThrowIfNullOrEmpty(hashedEmail);

        try
        {
            string computedHash = HashEmail(email);
            return string.Equals(computedHash, hashedEmail, StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }
}
