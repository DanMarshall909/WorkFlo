using WorkFlo.Application.Auth.Commands;
using WorkFlo.Contracts.Auth;
using WorkFlo.Domain.Common;
using FastEndpoints;
using MediatR;

namespace WorkFlo.Api.Endpoints.Auth;

/// <summary>
/// Endpoint for email verification
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public sealed class VerifyEmailEndpoint : Endpoint<VerifyEmailRequest, VerificationResponse>
{
    private readonly IMediator _mediator;

    public VerifyEmailEndpoint(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    public override void Configure()
    {
        Post("/api/auth/verify-email");
        AllowAnonymous();

        // Apply throttling for security
        IConfiguration config = Resolve<IConfiguration>();
        bool disableRateLimit = config.GetValue<bool>("RateLimit:DisableForTesting", false);

        if (!disableRateLimit)
        {
            Throttle(
                hitLimit: 10,
                durationSeconds: 300, // 5 minutes
                headerName: "X-Client-Id"
            );
        }

        Summary(s =>
        {
            s.Summary = "Verify email address";
            s.Description = "Verifies a user's email address using the verification token sent via email";
            s.ExampleRequest = new VerifyEmailRequest
            {
                Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            };
        });
    }

    public override async Task HandleAsync(VerifyEmailRequest request, CancellationToken ct)
    {
        // Map request to command
        var command = new CVerifyEmail
        {
            Token = request.Token
        };

        // Execute command
        Result<string> result = await _mediator.Send(command, ct).ConfigureAwait(false);

        // Return response
        if (result.IsSuccess)
        {
            await SendOkAsync(new VerificationResponse
            {
                Message = result.Value!,
                Success = true
            }, ct).ConfigureAwait(false);
        }
        else
        {
            await SendAsync(new VerificationResponse
            {
                Message = result.Error!,
                Success = false
            }, 400, ct).ConfigureAwait(false);
        }
    }
}
