using WorkFlo.Application.Auth.Services;
using MediatR;

namespace WorkFlo.Application.Auth.Queries;

/// <summary>
/// Handler for validating refresh tokens.
/// </summary>
public sealed class HValidateRefreshToken : IRequestHandler<QValidateRefreshToken, QValidateRefreshToken.Response?>
{
    private readonly IJwtTokenService _jwtTokenService;

    public HValidateRefreshToken(IJwtTokenService jwtTokenService)
    {
        _jwtTokenService = jwtTokenService;
    }

    /// <summary>
    /// Handles refresh token validation.
    /// </summary>
    /// <param name="request">The query containing refresh token.</param>
    /// <param name="cancellationToken">Cancellation token for the operation.</param>
    /// <returns>Validation result or null if invalid.</returns>
    public async Task<QValidateRefreshToken.Response?> Handle(QValidateRefreshToken request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);

        Guid? userId = await _jwtTokenService.GetUserIdFromTokenAsync(request.RefreshToken, cancellationToken)
            .ConfigureAwait(false);
        if (userId == null)
        {
            return null;
        }

        bool isValid = await _jwtTokenService
            .ValidateRefreshTokenAsync(request.RefreshToken, userId.Value, cancellationToken).ConfigureAwait(false);
        if (!isValid)
        {
            return null;
        }

        return new()
        {
            UserId = userId.Value,
            IsValid = true,
            ExpiresAt = _jwtTokenService.GetTokenExpiryTime(true) // Refresh tokens have longer expiry
        };
    }
}
