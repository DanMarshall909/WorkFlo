using System.Security.Claims;
using WorkFlo.Application.Auth.Queries;
using WorkFlo.Application.Common.Messaging;
using WorkFlo.Contracts.Auth;
using FastEndpoints;

namespace WorkFlo.Api.Endpoints.Auth;

/// <summary>
/// Endpoint for getting current user information
/// </summary>
internal sealed class CurrentUserEndpoint : EndpointWithoutRequest<CurrentUserResponse>
{
    private readonly IQueryDispatcher _queryDispatcher;

    public CurrentUserEndpoint(IQueryDispatcher queryDispatcher)
    {
        _queryDispatcher = queryDispatcher;
    }

    public override void Configure()
    {
        Get("/api/auth/me");
        Policies("RequireAuthenticatedUser");
        Summary(s =>
        {
            s.Summary = "Get current user";
            s.Description = "Returns current authenticated user information";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        // Get user ID from JWT token
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
        {
            await SendErrorsAsync(401, ct).ConfigureAwait(false);
            AddError("Invalid user token");
            return;
        }

        var query = new QGetCurrentUser { UserId = userId };

        QGetCurrentUser.Response? result = await _queryDispatcher
            .SendAsync<QGetCurrentUser, QGetCurrentUser.Response?>(query, ct).ConfigureAwait(false);

        if (result == null)
        {
            await SendErrorsAsync(404, ct).ConfigureAwait(false);
            AddError("User not found");
            return;
        }

        var response = new CurrentUserResponse
        {
            Id = result.Id,
            EmailHash = result.EmailHash,
            EmailVerified = result.EmailVerified,
            CreatedAt = result.CreatedAt,
            IsActive = result.IsActive
        };

        await SendOkAsync(response, ct).ConfigureAwait(false);
    }
}
