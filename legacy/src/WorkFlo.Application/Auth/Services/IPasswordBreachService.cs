namespace WorkFlo.Application.Auth.Services;

/// <summary>
/// Service for checking if passwords have been compromised in data breaches
/// </summary>
public interface IPasswordBreachService
{
    /// <summary>
    /// Checks if a password has been found in known data breaches
    /// </summary>
    /// <param name="password">The password to check</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if the password has been breached, false otherwise</returns>
    Task<bool> IsPasswordBreachedAsync(string password, CancellationToken cancellationToken = default);
}
