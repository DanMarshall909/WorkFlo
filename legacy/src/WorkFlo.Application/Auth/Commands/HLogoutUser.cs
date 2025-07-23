using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.CQRS;
using WorkFlo.Domain.Common;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Auth.Commands;

/// <summary>
/// Handler for user logout. Revokes refresh token and invalidates session.
/// </summary>
public class HLogoutUser : ICommandHandler<CLogoutUser, Result>
{
    private readonly IJwtTokenService _jwtTokenService;

    public HLogoutUser(IJwtTokenService jwtTokenService)
    {
        _jwtTokenService = jwtTokenService;
    }

    /// <summary>
    /// Handles user logout by revoking refresh token and invalidating session.
    /// </summary>
    /// <param name="request">The logout command containing refresh token and user ID.</param>
    /// <param name="cancellationToken">Cancellation token for the operation.</param>
    /// <returns>A result indicating success or failure.</returns>
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Design", "CA1031:Do not catch general exception types",
        Justification = "Command handler needs to catch all exceptions to return proper Result")]
    public async Task<Result> Handle(CLogoutUser request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            // Revoke refresh token
            await _jwtTokenService.RevokeRefreshTokenAsync(request.RefreshToken, cancellationToken)
                .ConfigureAwait(false);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to logout user: {ex.Message}");
        }
    }
}
