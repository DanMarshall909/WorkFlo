using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Common.Interfaces;

/// <summary>
/// Service for managing email verification tokens
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public interface IEmailVerificationTokenService
{
    /// <summary>
    /// Validates a verification token and returns the associated user ID
    /// </summary>
    /// <param name="token">The verification token to validate</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result containing the user ID if valid, or error if invalid/expired</returns>
    Task<Result<Guid>> ValidateTokenAsync(string token, CancellationToken cancellationToken);

    /// <summary>
    /// Generates a new verification token for a user
    /// </summary>
    /// <param name="userId">The user ID to generate token for</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The generated verification token</returns>
    Task<string> GenerateTokenAsync(Guid userId, CancellationToken cancellationToken);
}
