namespace WorkFlo.Application.Auth.Services;

/// <summary>
/// Service for privacy-first email hashing as per CLAUDE.md privacy requirements.
/// Stores email hashes instead of raw email addresses for privacy compliance.
/// </summary>
public interface IEmailHashingService
{
    /// <summary>
    /// Creates a secure hash of the email address for privacy-compliant storage.
    /// </summary>
    /// <param name="email">The email address to hash</param>
    /// <returns>A secure hash of the email address</returns>
    string HashEmail(string email);

    /// <summary>
    /// Verifies if the provided email matches the stored hash.
    /// </summary>
    /// <param name="email">The email address to verify</param>
    /// <param name="hashedEmail">The stored email hash</param>
    /// <returns>True if the email matches the hash, false otherwise</returns>
    bool VerifyEmail(string email, string hashedEmail);
}
