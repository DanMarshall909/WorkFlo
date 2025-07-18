using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.CQRS;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Common.Errors;
using WorkFlo.Domain.Users;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Auth.Commands;

/// <summary>
/// Handler for user registration. Creates new user account with privacy-first email hashing.
/// </summary>
public class HRegisterUser : ICommandHandler<CRegisterUser, Result<CRegisterUser.Response>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IEmailHashingService _emailHashingService;
    private readonly IPasswordBreachService _passwordBreachService;
    private readonly IEmailService _emailService;
    private readonly IEmailVerificationTokenService _emailVerificationTokenService;

    public HRegisterUser(
        IUserRepository userRepository,
        IPasswordHashingService passwordHashingService,
        IEmailHashingService emailHashingService,
        IPasswordBreachService passwordBreachService,
        IEmailService emailService,
        IEmailVerificationTokenService emailVerificationTokenService)
    {
        _userRepository = userRepository;
        _passwordHashingService = passwordHashingService;
        _emailHashingService = emailHashingService;
        _passwordBreachService = passwordBreachService;
        _emailService = emailService;
        _emailVerificationTokenService = emailVerificationTokenService;
    }

    /// <summary>
    /// Handles user registration by creating a new user account with hashed email and password.
    /// Sends verification email but does not return JWT tokens until email is verified.
    /// </summary>
    /// <param name="request">The registration command containing email and password.</param>
    /// <param name="cancellationToken">Cancellation token for the operation.</param>
    /// <returns>A result containing the new user info and verification instructions or failure information.</returns>
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Design", "CA1031:Do not catch general exception types",
        Justification = "Command handler needs to catch all exceptions to return proper Result")]
    public async Task<Result<CRegisterUser.Response>> Handle(CRegisterUser request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            // Hash email for privacy compliance (as per CLAUDE.md)
            string emailHash = _emailHashingService.HashEmail(request.Email);

            // Check if user already exists
            User? existingUser = await _userRepository.GetByEmailHashAsync(emailHash, cancellationToken)
                .ConfigureAwait(false);
            if (existingUser != null)
            {
                return Failure<CRegisterUser.Response>("A user with this email address already exists");
            }

            // Check if password has been breached
            bool isBreached = await _passwordBreachService.IsPasswordBreachedAsync(request.Password, cancellationToken)
                .ConfigureAwait(false);
            if (isBreached)
            {
                return Failure<CRegisterUser.Response>("This password has been found in a data breach. Please choose a different password.");
            }

            // Hash password
            string passwordHash = _passwordHashingService.HashPassword(request.Password);

            // Create new user using domain entity
            TypeSafeResult<User, ValidationError> userResult = User.Create(emailHash, passwordHash);
            if (!userResult.IsSuccess)
            {
                return Failure<CRegisterUser.Response>(userResult.Error.Message);
            }

            User user = userResult.Value;
            await _userRepository.AddAsync(user, cancellationToken).ConfigureAwait(false);

            // Generate verification token and send email
            string verificationToken = await _emailVerificationTokenService
                .GenerateTokenAsync(user.Id, cancellationToken).ConfigureAwait(false);

            Result emailResult = await _emailService.SendVerificationEmailAsync(
                request.Email,
                verificationToken,
                user.EmailHash,
                cancellationToken).ConfigureAwait(false);

            if (emailResult.IsFailure())
            {
                throw new InvalidOperationException(emailResult.Error ?? "Failed to send verification email");
            }

            // Do NOT generate JWT tokens - user must verify email first
            var response = new CRegisterUser.Response
            {
                UserId = user.Id,
                AccessToken = null,
                RefreshToken = null,
                ExpiresAt = null,
                EmailVerificationRequired = true,
                Message = "Registration successful. Please check your email for verification instructions.",
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
            return Failure<CRegisterUser.Response>($"Failed to register user: {ex.Message}");
        }
    }
}
