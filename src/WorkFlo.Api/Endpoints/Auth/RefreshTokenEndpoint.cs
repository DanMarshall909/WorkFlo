using WorkFlo.Application.Auth.Commands;
using WorkFlo.Application.Common.Messaging;
using WorkFlo.Contracts.Auth;
using WorkFlo.Domain.Common;
using FastEndpoints;

namespace WorkFlo.Api.Endpoints.Auth;

/// <summary>
/// Endpoint for token refresh
/// </summary>
internal sealed class RefreshTokenEndpoint : Endpoint<RefreshTokenRequest, RefreshTokenResponse>
{
    private readonly ICommandDispatcher _commandDispatcher;

    public RefreshTokenEndpoint(ICommandDispatcher commandDispatcher)
    {
        _commandDispatcher = commandDispatcher;
    }

    public override void Configure()
    {
        Post("/api/auth/refresh");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "Refresh access token";
            s.Description = "Refreshes access token using refresh token";
            s.ExampleRequest = new RefreshTokenRequest { RefreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." };
        });
    }

    public override async Task HandleAsync(RefreshTokenRequest req, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(req);

        var command = new CRefreshToken { RefreshToken = req.RefreshToken };

        Result<CRefreshToken.Response> result = await _commandDispatcher
            .SendAsync<CRefreshToken, Domain.Common.Result<CRefreshToken.Response>>(command, ct).ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            await SendErrorsAsync(401, ct).ConfigureAwait(false);
            AddError(result.Error ?? "Invalid refresh token");
            return;
        }

        var response = new RefreshTokenResponse
        {
            AccessToken = result.Value!.AccessToken,
            RefreshToken = result.Value!.RefreshToken,
            ExpiresAt = result.Value!.ExpiresAt
        };

        await SendOkAsync(response, ct).ConfigureAwait(false);
    }
}
