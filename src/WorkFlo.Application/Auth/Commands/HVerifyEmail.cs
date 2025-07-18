using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Users;
using MediatR;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Auth.Commands;

/// <summary>
/// Handler for email verification command
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public class HVerifyEmail : IRequestHandler<CVerifyEmail, Result<string>>
{
    private const string UserNotFoundError = "User not found";
    private const string SuccessMessage = "Email verified successfully";

    private readonly IUserRepository _userRepository;
    private readonly IEmailVerificationTokenService _tokenService;

    public HVerifyEmail(IUserRepository userRepository, IEmailVerificationTokenService tokenService)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
    }

    public async Task<Result<string>> Handle(CVerifyEmail request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return Failure<string>("Token is required");
        }

        // Validate the token
        Result<Guid> tokenResult = await _tokenService.ValidateTokenAsync(request.Token, cancellationToken).ConfigureAwait(false);
        if (tokenResult.IsFailure())
        {
            return Failure<string>(tokenResult.Error ?? "Invalid token");
        }

        // Get the user
        User? user = await _userRepository.GetByIdAsync(tokenResult.Value, cancellationToken).ConfigureAwait(false);
        if (user == null)
        {
            return Failure<string>(UserNotFoundError);
        }

        // Check if user is already verified
        if (user.EmailVerified)
        {
            return Success(SuccessMessage); // Idempotent operation
        }

        // Mark user as verified
        user.VerifyEmail();
        await _userRepository.UpdateAsync(user).ConfigureAwait(false);

        return Success(SuccessMessage);
    }
}
