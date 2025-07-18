
using FastEndpoints;
using WorkFlo.Contracts.Validation;

namespace WorkFlo.Api.Endpoints.Validation;

[HttpPost("/api/validation/pre-commit")]
public class PreCommitValidationEndpoint : Endpoint<PreCommitValidationRequest, PreCommitValidationResponse>
{
    public override Task HandleAsync(PreCommitValidationRequest req, CancellationToken ct)
    {
        // For now, just return a successful validation
        return SendOkAsync(new PreCommitValidationResponse
        {
            IsValid = true,
            Errors = new List<string>()
        }, ct);
    }
}
