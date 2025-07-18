using WorkFlo.Domain.Common;
using MediatR;

namespace WorkFlo.Application.Auth.Commands;

/// <summary>
/// Command for resending email verification
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public class CResendVerification : IRequest<Result<string>>
{
    public required string Email { get; set; }
}
