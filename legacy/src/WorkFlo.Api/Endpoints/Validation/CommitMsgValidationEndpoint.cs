
using System.Linq;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;
using WorkFlo.Application.Services;
using WorkFlo.Contracts.Validation;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Api.Endpoints.Validation;

[HttpPost("/api/validation/commit-msg")]
[AllowAnonymous]
public class CommitMsgValidationEndpoint : Endpoint<CommitMsgValidationRequest, CommitMsgValidationResponse>
{
    private readonly ITddStateService _tddStateService;
    private readonly IConfigurationService _configurationService;

    public CommitMsgValidationEndpoint(ITddStateService tddStateService, IConfigurationService configurationService)
    {
        _tddStateService = tddStateService;
        _configurationService = configurationService;
    }

    public override Task HandleAsync(CommitMsgValidationRequest req, CancellationToken ct)
    {
        return HandleInternalAsync(req, ct);
    }

    private async Task HandleInternalAsync(CommitMsgValidationRequest req, CancellationToken ct)
    {
        CommitMsgValidationResponse response = new()
        {
            IsValid = true,
            Errors = new List<string>()
        };

        // Get configuration settings
        Domain.Common.Result<ValidationSettings> configResult = await _configurationService.GetValidationRulesAsync().ConfigureAwait(false);
        if (configResult.IsFailure())
        {
            response.IsValid = false;
            response.Errors.Add($"Configuration error: {configResult.Error}");
            await SendOkAsync(response, ct).ConfigureAwait(false);
            return;
        }

        ValidationSettings validationConfig = configResult.Value!;

        // Skip TDD validation if disabled in configuration
        if (!validationConfig.EnableTdd)
        {
            await SendOkAsync(response, ct).ConfigureAwait(false);
            return;
        }

        // Check if commit message follows TDD format
        if (req?.CommitMessage != null && !string.IsNullOrWhiteSpace(req.CommitMessage) && req.CommitMessage.StartsWith('#'))
        {
            // Parse TDD commit format: #<ticket> <phase>: <feature> - <description>
            string[] parts = req.CommitMessage.Split(' ', 4);
            if (parts.Length >= 3)
            {
                string phaseStr = parts[1].TrimEnd(':');
                string featureName = parts[2];

                // Map string phases to enum
                var phaseMapping = new Dictionary<string, TddPhase>(StringComparer.Ordinal)
                {
                    ["R"] = TddPhase.Red,
                    ["G"] = TddPhase.Green,
                    ["REFACTOR"] = TddPhase.Refactor,
                    ["C"] = TddPhase.Cover,
                    ["M"] = TddPhase.Mutation,
                    ["REVIEW"] = TddPhase.Review,
                    ["DONE"] = TddPhase.Done
                };

                if (!phaseMapping.TryGetValue(phaseStr, out TddPhase newPhase))
                {
                    response.IsValid = false;
                    response.Errors.Add($"Invalid TDD phase '{phaseStr}'. Valid phases are: R (RED), G (GREEN), REFACTOR, C (COVER), M (MUTATION), REVIEW, DONE");
                }
                else
                {
                    // Get TDD settings to check if transition enforcement is enabled
                    Domain.Common.Result<TddSettings> tddConfigResult = await _configurationService.GetTddSettingsAsync().ConfigureAwait(false);
                    bool enforceTransitions = tddConfigResult.IsSuccess && tddConfigResult.Value!.EnforceTransitions;

                    // Check phase transition only if enforcement is enabled
                    if (enforceTransitions)
                    {
                        Domain.Common.Result<TddPhase> currentPhaseResult = await _tddStateService.GetCurrentPhaseAsync(featureName).ConfigureAwait(false);
                        if (currentPhaseResult.IsSuccess)
                        {
                            TddPhase currentPhase = currentPhaseResult.Value;
                            if (currentPhase != TddPhase.None)
                            {
                                Domain.Common.Result<bool> transitionResult = await _tddStateService.ValidatePhaseTransitionAsync(featureName, currentPhase, newPhase).ConfigureAwait(false);
                                if (transitionResult.IsSuccess && !transitionResult.Value)
                                {
                                    response.IsValid = false;
                                    response.Errors.Add($"Invalid phase transition from {currentPhase} to {newPhase}");
                                }
                            }
                        }
                    }

                    // Update state if valid
                    if (response.IsValid)
                    {
                        await _tddStateService.SetPhaseAsync(featureName, newPhase).ConfigureAwait(false);
                    }
                }
            }
        }

        await SendOkAsync(response, ct).ConfigureAwait(false);
    }
}
