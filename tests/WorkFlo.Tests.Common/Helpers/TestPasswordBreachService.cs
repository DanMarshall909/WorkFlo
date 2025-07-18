using WorkFlo.Application.Auth.Services;

namespace WorkFlo.Tests.Common.Helpers;

/// <summary>
/// Test implementation of password breach service that doesn't check external services
/// </summary>
internal sealed class TestPasswordBreachService : IPasswordBreachService
{
    public Task<bool> IsPasswordBreachedAsync(string password, CancellationToken cancellationToken = default)
    {
        // For testing, only consider obvious weak passwords as breached
        var breachedPasswords = new[] { "123456", "password", "admin", "test" };
        return Task.FromResult(breachedPasswords.Contains(password, StringComparer.OrdinalIgnoreCase));
    }
}
