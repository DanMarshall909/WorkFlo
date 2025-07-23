using WorkFlo.Application.Auth.Services;

namespace WorkFlo.Tests.Common.Helpers;

/// <summary>
/// Test implementation of password hashing service for reliable testing
/// </summary>
internal sealed class TestPasswordHashingService : IPasswordHashingService
{
    public string HashPassword(string password)
    {
        // Simple deterministic "hash" for testing
        return $"hashed-{password}";
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        return string.Equals(hashedPassword, $"hashed-{password}", StringComparison.Ordinal);
    }
}
