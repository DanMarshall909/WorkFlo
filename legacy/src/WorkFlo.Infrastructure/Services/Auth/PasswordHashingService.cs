using System.Security.Cryptography;
using WorkFlo.Application.Auth.Services;

namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// Password hashing service using BCrypt for secure password hashing
/// </summary>
public class PasswordHashingService : IPasswordHashingService
{
    private const int WorkFactor = 12; // BCrypt work factor (cost)

    public string HashPassword(string password)
    {
        ArgumentException.ThrowIfNullOrEmpty(password);
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        ArgumentException.ThrowIfNullOrEmpty(password);
        ArgumentException.ThrowIfNullOrEmpty(hashedPassword);

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }
        catch
        {
            return false;
        }
    }
}
