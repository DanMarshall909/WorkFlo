
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;

namespace WorkFlo.Api.Endpoints.Health;

[HttpGet("/api/health"), AllowAnonymous]
public class HealthCheckEndpoint : EndpointWithoutRequest<string>
{
    public override Task HandleAsync(CancellationToken ct)
    {
        return SendStringAsync("Healthy", cancellation: ct);
    }
}
