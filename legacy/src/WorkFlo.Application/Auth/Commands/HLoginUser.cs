using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.CQRS;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Users;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Auth.Commands;

/// <summary>
/// Handler for user login. Validates credentials and generates JWT tokens.
/// </summary>
public class HLoginUser : ICommandHandler<CLoginUser, Result<CLoginUser.Response>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IEmailHashingService _emailHashingService;
    private readonly IJwtTokenService _jwtTokenService;

    public HLoginUser(
        IUserRepository userRepository,
        IPasswordHashingService passwordHashingService,
        IEmailHashingService emailHashingService,
        IJwtTokenService jwtTokenService)
    {
        _userRepository = userRepository;
        _passwordHashingService = passwordHashingService;
        _emailHashingService = emailHashingService;
        _jwtTokenService = jwtTokenService;
    }

    /// <summary>
    /// Handles user login by validating credentials and generating JWT tokens.
    /// </summary>
    /// <param name="request">The login command containing email and password.</param>
    /// <param name="cancellationToken">Cancellation token for the operation.</param>
    /// <returns>A result containing the user info and JWT tokens or failure information.</returns>
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Design", "CA1031:Do not catch general exception types",
        Justification = "Command handler needs to catch all exceptions to return proper Result")]
    public async Task<Result<CLoginUser.Response>> Handle(CLoginUser request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            // Hash email for privacy compliance (as per CLAUDE.md)
            string emailHash = _emailHashingService.HashEmail(request.Email);

            // Find user by email hash
            User? user = await _userRepository.GetByEmailHashAsync(emailHash, cancellationToken).ConfigureAwait(false);
            if (user == null)
            {
                return Failure<CLoginUser.Response>("Invalid email or password");
            }

            // Verify password
            if (!_passwordHashingService.VerifyPassword(request.Password, user.PasswordHash))
            {
                return Failure<CLoginUser.Response>("Invalid email or password");
            }

            // Check if user is active
            if (!user.IsActive)
            {
                return Failure<CLoginUser.Response>("User account is deactivated");
            }

            // Check if email is verified
            if (!user.EmailVerified)
            {
                return Failure<CLoginUser.Response>("Please complete email verification before logging in. Check your email for the verification link.");
            }

            // Generate JWT tokens
            string accessToken = await _jwtTokenService
                .GenerateAccessTokenAsync(user.Id, user.EmailHash, cancellationToken).ConfigureAwait(false);
            string refreshToken = await _jwtTokenService.GenerateRefreshTokenAsync(user.Id, cancellationToken)
                .ConfigureAwait(false);
            DateTime expiresAt = _jwtTokenService.GetTokenExpiryTime(request.RememberMe);

            var response = new CLoginUser.Response
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = new()
                {
                    Id = user.Id,
                    EmailHash = user.EmailHash,
                    EmailVerified = user.EmailVerified,
                    CreatedAt = user.CreatedAt
                }
            };

            return Success(response);
        }
        catch (Exception ex)
        {
            return Failure<CLoginUser.Response>($"Failed to login user: {ex.Message}");
        }
    }
}
