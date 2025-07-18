using WorkFlo.Application.Auth.Commands;
using WorkFlo.Contracts.Auth;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace WorkFlo.Api.Endpoints.Auth;

/// <summary>
/// OAuth authentication endpoint for Google and Microsoft providers
/// Implements privacy-first authentication with minimal data collection
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
public sealed class OAuthLoginEndpoint : Endpoint<OAuthLoginRequest, OAuthLoginResponse>
{
    private readonly IMediator _mediator;

    public OAuthLoginEndpoint(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    public override void Configure()
    {
        Post("/api/auth/oauth/login");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "OAuth authentication with Google or Microsoft";
            s.Description = "Authenticates users via OAuth 2.0 providers with privacy-first approach";
            s.Responses[200] = "Authentication successful";
            s.Responses[400] = "Invalid request or OAuth provider error";
            s.Responses[401] = "Authentication failed";
        });
    }

    public override async Task HandleAsync(OAuthLoginRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);

        // Validate required fields explicitly to ensure proper 400 responses
        if (string.IsNullOrWhiteSpace(request.Provider))
        {
            await SendErrorsAsync(400, ct).ConfigureAwait(false);
            return;
        }

        if (string.IsNullOrWhiteSpace(request.AuthorizationCode))
        {
            await SendErrorsAsync(400, ct).ConfigureAwait(false);
            return;
        }

        var command = new COAuthLogin
        {
            Provider = request.Provider,
            AuthorizationCode = request.AuthorizationCode,
            RedirectUri = request.RedirectUri,
            RememberMe = request.RememberMe
        };

        Domain.Common.Result<COAuthLogin.Response> result = await _mediator.Send(command, ct).ConfigureAwait(false);

        if (result.IsSuccess)
        {
            var response = new OAuthLoginResponse
            {
                AccessToken = result.Value!.AccessToken,
                RefreshToken = result.Value!.RefreshToken,
                ExpiresAt = result.Value!.ExpiresAt,
                IsNewUser = result.Value!.IsNewUser,
                User = new OAuthLoginResponse.UserInfo
                {
                    Id = result.Value!.User.Id,
                    EmailHash = result.Value!.User.EmailHash,
                    EmailVerified = result.Value!.User.EmailVerified,
                    CreatedAt = result.Value!.User.CreatedAt,
                    PreferredName = result.Value!.User.PreferredName
                }
            };

            await SendOkAsync(response, ct).ConfigureAwait(false);
        }
        else
        {
            // Create response with error message for proper JSON structure
            var errorResponse = new OAuthLoginResponse
            {
                Error = result.Error ?? "OAuth authentication failed"
            };

            await SendAsync(errorResponse, 401, ct).ConfigureAwait(false);
        }
    }
}
