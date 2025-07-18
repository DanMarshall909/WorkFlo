using WorkFlo.Application.Auth.Services;

namespace WorkFlo.Tests.Common.Helpers;

/// <summary>
/// Test implementation of email hashing service for reliable testing
/// </summary>
internal sealed class TestEmailHashingService : IEmailHashingService
{
    public string HashEmail(string email)
    {
        // Simple deterministic "hash" for testing
        return $"hashed-{email}";
    }

    public bool VerifyEmail(string email, string hashedEmail)
    {
        return string.Equals(hashedEmail, $"hashed-{email}", StringComparison.Ordinal);
    }
}
