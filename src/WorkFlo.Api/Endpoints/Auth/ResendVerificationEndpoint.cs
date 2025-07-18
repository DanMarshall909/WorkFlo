using WorkFlo.Application.Auth.Commands;
using WorkFlo.Contracts.Auth;
using WorkFlo.Domain.Common;
using FastEndpoints;
using MediatR;

namespace WorkFlo.Api.Endpoints.Auth;

/// <summary>
/// Endpoint for resending email verification
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public sealed class ResendVerificationEndpoint : Endpoint<ResendVerificationRequest, VerificationResponse>
{
    private readonly IMediator _mediator;

    public ResendVerificationEndpoint(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    public override void Configure()
    {
        Post("/api/auth/resend-verification");
        AllowAnonymous();

        // Apply stricter throttling for email sending
        IConfiguration config = Resolve<IConfiguration>();
        bool disableRateLimit = config.GetValue<bool>("RateLimit:DisableForTesting", false);

        if (!disableRateLimit)
        {
            Throttle(
                hitLimit: 3,
                durationSeconds: 300, // 5 minutes
                headerName: "X-Client-Id"
            );
        }

        Summary(s =>
        {
            s.Summary = "Resend email verification";
            s.Description = "Resends the email verification link to the specified email address";
            s.ExampleRequest = new ResendVerificationRequest
            {
                Email = "user@example.com"
            };
        });
    }

    public override async Task HandleAsync(ResendVerificationRequest request, CancellationToken cancellationToken)
    {
        // Map request to command
        var command = new CResendVerification
        {
            Email = request.Email
        };

        // Execute command
        Result<string> result = await _mediator.Send(command, cancellationToken).ConfigureAwait(false);

        // Return response
        if (result.IsSuccess)
        {
            await SendOkAsync(new VerificationResponse
            {
                Message = result.Value!,
                Success = true
            }, cancellationToken).ConfigureAwait(false);
        }
        else
        {
            await SendAsync(new VerificationResponse
            {
                Message = result.Error!,
                Success = false
            }, 400, cancellationToken).ConfigureAwait(false);
        }
    }
}
