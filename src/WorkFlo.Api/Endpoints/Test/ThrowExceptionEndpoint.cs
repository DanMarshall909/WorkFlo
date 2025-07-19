
using FastEndpoints;

namespace WorkFlo.Api.Endpoints.Test;

[HttpGet("/api/test/throw-exception")]
public class ThrowExceptionEndpoint : EndpointWithoutRequest
{
    public override Task HandleAsync(CancellationToken ct)
    {
        throw new InvalidOperationException("This is a test exception");
    }
}
