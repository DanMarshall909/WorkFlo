using System.Security.Claims;
using WorkFlo.Application.Auth.Commands;
using WorkFlo.Application.Common.Messaging;
using WorkFlo.Contracts.Auth;
using WorkFlo.Domain.Common;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;

namespace WorkFlo.Api.Endpoints.Auth;

/// <summary>
/// Endpoint for user logout
/// </summary>
internal sealed class LogoutEndpoint : Endpoint<LogoutRequest>
{
    private readonly ICommandDispatcher _commandDispatcher;

    public LogoutEndpoint(ICommandDispatcher commandDispatcher)
    {
        _commandDispatcher = commandDispatcher;
    }

    public override void Configure()
    {
        Post("/api/auth/logout");
        Policies("RequireAuthenticatedUser");
        Summary(s =>
        {
            s.Summary = "Logout user";
            s.Description = "Revokes refresh token and logs out user";
            s.ExampleRequest = new LogoutRequest { RefreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." };
        });
    }

    public override async Task HandleAsync(LogoutRequest req, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(req);

        // Get user ID from JWT token
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
        {
            await SendErrorsAsync(401, ct).ConfigureAwait(false);
            AddError("Invalid user token");
            return;
        }

        var command = new CLogoutUser { RefreshToken = req.RefreshToken, UserId = userId };

        Result result = await _commandDispatcher.SendAsync<CLogoutUser, Domain.Common.Result>(command, ct)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            await SendErrorsAsync(400, ct).ConfigureAwait(false);
            AddError(result.Error ?? "Failed to logout");
            return;
        }

        await SendOkAsync(ct).ConfigureAwait(false);
    }
}
