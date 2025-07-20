
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;
using WorkFlo.Contracts.Validation;
using System.Linq;

namespace WorkFlo.Api.Endpoints.Validation;

[HttpPost("/api/validation/commit-msg")]
[AllowAnonymous]
public class CommitMsgValidationEndpoint : Endpoint<CommitMsgValidationRequest, CommitMsgValidationResponse>
{
    public override Task HandleAsync(CommitMsgValidationRequest req, CancellationToken ct)
    {
        CommitMsgValidationResponse response = new()
        {
            IsValid = true,
            Errors = new List<string>()
        };

        // Check if commit message follows TDD format
        if (req?.CommitMessage != null && !string.IsNullOrWhiteSpace(req.CommitMessage) && req.CommitMessage.StartsWith('#'))
        {
            // Parse TDD commit format: #<ticket> <phase>: <feature> - <description>
            string[] parts = req.CommitMessage.Split(' ', 3);
            if (parts.Length >= 2)
            {
                string phase = parts[1].TrimEnd(':');
                string[] validPhases = ["R", "G", "REFACTOR", "C", "M", "REVIEW", "DONE"];
                
                if (!validPhases.Contains(phase, StringComparer.Ordinal))
                {
                    response.IsValid = false;
                    response.Errors.Add($"Invalid TDD phase '{phase}'. Valid phases are: R (RED), G (GREEN), REFACTOR, C (COVER), M (MUTATION), REVIEW, DONE");
                }
            }
        }

        return SendOkAsync(response, ct);
    }
}
