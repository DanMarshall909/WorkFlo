using WorkFlo.Application.Auth.Services;

namespace WorkFlo.Infrastructure.Services;

/// <summary>
/// Local implementation of password breach checking that uses a hardcoded list of common breached passwords.
/// For production, replace with HaveIBeenPwned API or similar service.
/// </summary>
public class LocalPasswordBreachService : IPasswordBreachService
{
    // Common breached passwords - in production, use HaveIBeenPwned API
    private readonly HashSet<string> _breachedPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "123456", "12345678", "password123", "admin", "letmein",
        "welcome", "monkey", "dragon", "baseball", "iloveyou", "trustno1",
        "1234567", "sunshine", "master", "123456789", "welcome123", "password1",
        "qwerty", "abc123", "111111", "1234567890", "123123", "password123!",
        "admin123", "root", "toor", "test", "guest", "12345", "123",
        "password1234", "123qwe", "qwerty123", "1q2w3e", "1q2w3e4r", "1q2w3e4r5t"
    };

    public Task<bool> IsPasswordBreachedAsync(string password, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(password);

        // Check against local list
        bool isBreached = _breachedPasswords.Contains(password);

        return Task.FromResult(isBreached);
    }
}
