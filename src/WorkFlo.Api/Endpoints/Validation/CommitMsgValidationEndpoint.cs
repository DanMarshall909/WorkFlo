
using FastEndpoints;
using WorkFlo.Contracts.Validation;

namespace WorkFlo.Api.Endpoints.Validation;

[HttpPost("/api/validation/commit-msg")]
public class CommitMsgValidationEndpoint : Endpoint<CommitMsgValidationRequest, CommitMsgValidationResponse>
{
    public override Task HandleAsync(CommitMsgValidationRequest req, CancellationToken ct)
    {
        // For now, just return a successful validation
        return SendOkAsync(new CommitMsgValidationResponse
        {
            IsValid = true,
            Errors = new List<string>()
        }, ct);
    }
}
