using MediatR;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Auth.Commands;

/// <summary>
/// Command for verifying user email address
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public class CVerifyEmail : IRequest<Result<string>>
{
    public required string Token { get; set; }
}
