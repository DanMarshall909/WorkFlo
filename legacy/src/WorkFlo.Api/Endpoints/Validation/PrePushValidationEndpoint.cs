
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;
using WorkFlo.Contracts.Validation;

namespace WorkFlo.Api.Endpoints.Validation;

[HttpPost("/api/validation/pre-push")]
[AllowAnonymous]
public class PrePushValidationEndpoint : Endpoint<PrePushValidationRequest, PrePushValidationResponse>
{
    public override async Task HandleAsync(PrePushValidationRequest req, CancellationToken ct)
    {
        if (req == null)
        {
            await SendAsync(new PrePushValidationResponse
            {
                IsValid = false,
                Errors = new List<string> { "Invalid request" }
            }, 400, ct).ConfigureAwait(false);
            return;
        }

        // For now, just return a successful validation
        var response = new PrePushValidationResponse
        {
            IsValid = true,
            Errors = new List<string>()
        };

        await SendOkAsync(response, ct).ConfigureAwait(false);
    }
}
