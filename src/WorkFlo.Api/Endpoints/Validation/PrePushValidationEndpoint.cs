
using FastEndpoints;
using WorkFlo.Contracts.Validation;

namespace WorkFlo.Api.Endpoints.Validation;

[HttpPost("/api/validation/pre-push")]
public class PrePushValidationEndpoint : Endpoint<PrePushValidationRequest, PrePushValidationResponse>
{
    public override Task HandleAsync(PrePushValidationRequest req, CancellationToken ct)
    {
        // For now, just return a successful validation
        return SendOkAsync(new PrePushValidationResponse
        {
            IsValid = true,
            Errors = new List<string>()
        }, ct);
    }
}
