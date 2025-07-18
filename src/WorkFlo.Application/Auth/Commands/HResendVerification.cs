using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Users;
using MediatR;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Auth.Commands;

/// <summary>
/// Handler for resending email verification
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public class HResendVerification : IRequestHandler<CResendVerification, Result<string>>
{
    private const string UserNotFoundError = "User not found";
    private const string AlreadyVerifiedError = "Email is already verified";
    private const string SuccessMessage = "Verification email sent successfully";

    private readonly IUserRepository _userRepository;
    private readonly IEmailHashingService _emailHashingService;
    private readonly IEmailVerificationTokenService _tokenService;
    private readonly IEmailService _emailService;

    public HResendVerification(
        IUserRepository userRepository,
        IEmailHashingService emailHashingService,
        IEmailVerificationTokenService tokenService,
        IEmailService emailService)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _emailHashingService = emailHashingService ?? throw new ArgumentNullException(nameof(emailHashingService));
        _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
    }

    public async Task<Result<string>> Handle(CResendVerification request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return Failure<string>("Email is required");
        }

        // Hash the email to find the user
        string emailHash = _emailHashingService.HashEmail(request.Email);
        User? user = await _userRepository.GetByEmailHashAsync(emailHash, cancellationToken).ConfigureAwait(false);

        if (user == null)
        {
            return Failure<string>(UserNotFoundError);
        }

        // Check if already verified
        if (user.EmailVerified)
        {
            return Failure<string>(AlreadyVerifiedError);
        }

        // Generate new verification token
        string token = await _tokenService.GenerateTokenAsync(user.Id, cancellationToken).ConfigureAwait(false);

        // Send verification email (using empty username for now)
        Result emailResult = await _emailService.SendVerificationEmailAsync(request.Email, token, "", cancellationToken).ConfigureAwait(false);
        if (emailResult.IsFailure())
        {
            return Failure<string>("Failed to send verification email");
        }

        return Success(SuccessMessage);
    }
}
