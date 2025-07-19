
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;
using WorkFlo.Application.Services;
using WorkFlo.Contracts.Validation;
using WorkFlo.Domain.Common;

namespace WorkFlo.Api.Endpoints.Validation;

[HttpPost("/api/validation/pre-commit")]
[AllowAnonymous]
public class PreCommitValidationEndpoint : Endpoint<PreCommitValidationRequest, PreCommitValidationResponse>
{
    private readonly ICommitValidationService _validationService;

    public PreCommitValidationEndpoint(ICommitValidationService validationService)
    {
        _validationService = validationService;
    }

    public override async Task HandleAsync(PreCommitValidationRequest req, CancellationToken ct)
    {
        if (req == null)
        {
            await SendAsync(new PreCommitValidationResponse
            {
                IsValid = false,
                Errors = new List<string> { "Invalid request" }
            }, 400, ct).ConfigureAwait(false);
            return;
        }

        var result = await _validationService.ValidatePreCommitAsync(
            req.StagedFiles?.ToArray() ?? Array.Empty<string>(),
            req.CurrentBranch ?? string.Empty
        ).ConfigureAwait(false);

        var response = new PreCommitValidationResponse
        {
            IsValid = result.IsSuccess,
            Errors = result.IsFailure() ? new List<string> { result.Error! } : new List<string>()
        };

        await SendOkAsync(response, ct).ConfigureAwait(false);
    }
}
