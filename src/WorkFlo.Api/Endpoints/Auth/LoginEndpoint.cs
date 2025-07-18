using WorkFlo.Application.Auth.Commands;
using WorkFlo.Application.Common.Messaging;
using WorkFlo.Contracts.Auth;
using WorkFlo.Domain.Common;
using FastEndpoints;

namespace WorkFlo.Api.Endpoints.Auth;

/// <summary>
/// Endpoint for user login
/// </summary>
public sealed class LoginEndpoint : Endpoint<LoginRequest, AuthResponse>
{
    private readonly ICommandDispatcher _commandDispatcher;

    public LoginEndpoint(ICommandDispatcher commandDispatcher)
    {
        _commandDispatcher = commandDispatcher;
    }

    public override void Configure()
    {
        Post("/api/auth/login");
        AllowAnonymous();

        // Only apply throttling in non-test environments
        IWebHostEnvironment environment = Resolve<IWebHostEnvironment>();
        if (!environment.IsEnvironment("Testing"))
        {
            Throttle(
                hitLimit: 10,
                durationSeconds: 60,
                headerName: "X-Client-Id" // Rate limit per IP, more lenient than registration
            );
        }
        Summary(s =>
        {
            s.Summary = "Login user";
            s.Description = "Authenticates user with email and password, returns JWT tokens";
            s.ExampleRequest = new LoginRequest
            {
                Email = "user@example.com",
                Password = "SecurePassword123!",
                RememberMe = false
            };
        });
    }

    public override async Task HandleAsync(LoginRequest req, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(req);

        var command = new CLoginUser { Email = req.Email, Password = req.Password, RememberMe = req.RememberMe };

        Result<CLoginUser.Response> result = await _commandDispatcher
            .SendAsync<CLoginUser, Domain.Common.Result<CLoginUser.Response>>(command, ct).ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            await SendErrorsAsync(401, ct).ConfigureAwait(false);
            AddError(result.Error ?? "Invalid credentials");
            return;
        }

        var response = new AuthResponse
        {
            AccessToken = result.Value!.AccessToken,
            RefreshToken = result.Value!.RefreshToken,
            ExpiresAt = result.Value!.ExpiresAt,
            User = new()
            {
                Id = result.Value!.User.Id,
                EmailHash = result.Value!.User.EmailHash,
                EmailVerified = result.Value!.User.EmailVerified,
                CreatedAt = result.Value!.User.CreatedAt
            }
        };

        await SendOkAsync(response, ct).ConfigureAwait(false);
    }
}
