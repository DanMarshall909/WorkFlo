using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.CQRS;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Users;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Auth.Commands;

/// <summary>
/// Handler for token refresh. Validates refresh token and generates new access token.
/// </summary>
public class HRefreshToken : ICommandHandler<CRefreshToken, Result<CRefreshToken.Response>>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;

    public HRefreshToken(
        IUserRepository userRepository,
        IJwtTokenService jwtTokenService)
    {
        _userRepository = userRepository;
        _jwtTokenService = jwtTokenService;
    }

    /// <summary>
    /// Handles token refresh by validating refresh token and generating new tokens.
    /// </summary>
    /// <param name="request">The refresh token command.</param>
    /// <param name="cancellationToken">Cancellation token for the operation.</param>
    /// <returns>A result containing new JWT tokens or failure information.</returns>
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Design", "CA1031:Do not catch general exception types",
        Justification = "Command handler needs to catch all exceptions to return proper Result")]
    public async Task<Result<CRefreshToken.Response>> Handle(CRefreshToken request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            // Get user ID from refresh token
            Guid? userId = await _jwtTokenService.GetUserIdFromTokenAsync(request.RefreshToken, cancellationToken)
                .ConfigureAwait(false);
            if (userId == null)
            {
                return Failure<CRefreshToken.Response>("Invalid refresh token");
            }

            // Validate refresh token
            if (!await _jwtTokenService.ValidateRefreshTokenAsync(request.RefreshToken, userId.Value, cancellationToken)
                    .ConfigureAwait(false))
            {
                return Failure<CRefreshToken.Response>("Invalid or expired refresh token");
            }

            // Get user for token generation
            User? user = await _userRepository.GetByIdAsync(userId.Value, cancellationToken).ConfigureAwait(false);
            if (user == null || !user.IsActive)
            {
                return Failure<CRefreshToken.Response>("User not found or inactive");
            }

            // Generate new tokens
            string accessToken = await _jwtTokenService
                .GenerateAccessTokenAsync(user.Id, user.EmailHash, cancellationToken).ConfigureAwait(false);
            string refreshToken = await _jwtTokenService.GenerateRefreshTokenAsync(user.Id, cancellationToken)
                .ConfigureAwait(false);
            DateTime expiresAt = _jwtTokenService.GetTokenExpiryTime();

            // Revoke old refresh token
            await _jwtTokenService.RevokeRefreshTokenAsync(request.RefreshToken, cancellationToken)
                .ConfigureAwait(false);

            var response = new CRefreshToken.Response
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt
            };

            return Success(response);
        }
        catch (Exception ex)
        {
            return Failure<CRefreshToken.Response>($"Failed to refresh token: {ex.Message}");
        }
    }
}
