using WorkFlo.Api.Validators;
using WorkFlo.Application.Auth.Commands;
using WorkFlo.Application.Common.Messaging;
using WorkFlo.Contracts.Auth;
using WorkFlo.Domain.Common;
using FastEndpoints;

namespace WorkFlo.Api.Endpoints.Auth;

/// <summary>
/// Endpoint for user registration
/// </summary>
internal sealed class RegisterEndpoint : Endpoint<RegisterRequest, AuthResponse>
{
    private readonly ICommandDispatcher _commandDispatcher;

    public RegisterEndpoint(ICommandDispatcher commandDispatcher)
    {
        _commandDispatcher = commandDispatcher;
    }

    public override void Configure()
    {
        Post("/api/auth/register");
        AllowAnonymous();

        // Enable validation for the endpoint
        Validator<RegisterRequestValidator>();

        // Apply throttling unless explicitly disabled
        IConfiguration config = Resolve<IConfiguration>();
        bool disableRateLimit = config.GetValue<bool>("RateLimit:DisableForTesting", false);

        if (!disableRateLimit)
        {
            Throttle(
                hitLimit: 5,
                durationSeconds: 60,
                headerName: "X-Client-Id" // Rate limit per IP by default
            );
        }
        Summary(s =>
        {
            s.Summary = "Register a new user";
            s.Description = "Creates a new user account with email and password";
            s.ExampleRequest = new RegisterRequest
            {
                Email = "user@example.com",
                Password = "SecurePassword123!",
                ConfirmPassword = "SecurePassword123!"
            };
        });
    }

    public override async Task HandleAsync(RegisterRequest req, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(req);

        // Log the request to debug
        Logger.LogInformation("Registration attempt for email: {Email}", req.Email);

        var command = new CRegisterUser
        {
            Email = req.Email,
            Password = req.Password,
            ConfirmPassword = req.ConfirmPassword
        };

        Result<CRegisterUser.Response> result = await _commandDispatcher
            .SendAsync<CRegisterUser, Domain.Common.Result<CRegisterUser.Response>>(command, ct).ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            string errorMessage = result.Error ?? "Failed to register user";
            Logger.LogError("Registration failed: {Error}", errorMessage);
            AddError("registration", errorMessage);
            await SendErrorsAsync(400, ct).ConfigureAwait(false);
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
