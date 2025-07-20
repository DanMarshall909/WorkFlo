using WorkFlo.Domain.Common;
using System.Collections.Concurrent;
using System.Linq;

namespace WorkFlo.Application.Services;

public class TddStateService : ITddStateService
{
    private readonly ConcurrentDictionary<string, TddPhase> _featureStates = new();

    public Task<Result<TddPhase>> GetCurrentPhaseAsync(string featureName)
    {
        if (string.IsNullOrWhiteSpace(featureName))
        {
            return Task.FromResult(ResultExtensions.Failure<TddPhase>("Feature name cannot be empty"));
        }

        TddPhase phase = _featureStates.GetOrAdd(featureName, TddPhase.None);
        return Task.FromResult(ResultExtensions.Success(phase));
    }

    public Task<Result> SetPhaseAsync(string featureName, TddPhase phase)
    {
        if (string.IsNullOrWhiteSpace(featureName))
        {
            return Task.FromResult(Result.Failure("Feature name cannot be empty"));
        }

        _featureStates.AddOrUpdate(featureName, phase, (_, _) => phase);
        return Task.FromResult(Result.Success());
    }

    public Task<Result<bool>> ValidatePhaseTransitionAsync(string featureName, TddPhase fromPhase, TddPhase toPhase)
    {
        if (string.IsNullOrWhiteSpace(featureName))
        {
            return Task.FromResult(ResultExtensions.Failure<bool>("Feature name cannot be empty"));
        }

        // Define valid transitions
        Dictionary<TddPhase, TddPhase[]> validTransitions = new()
        {
            [TddPhase.None] = [TddPhase.Red],
            [TddPhase.Red] = [TddPhase.Green],
            [TddPhase.Green] = [TddPhase.Refactor, TddPhase.Red, TddPhase.Cover],
            [TddPhase.Refactor] = [TddPhase.Red, TddPhase.Cover],
            [TddPhase.Cover] = [TddPhase.Red, TddPhase.Mutation],
            [TddPhase.Mutation] = [TddPhase.Red, TddPhase.Review],
            [TddPhase.Review] = [TddPhase.Done, TddPhase.Red],
            [TddPhase.Done] = [TddPhase.Red] // Can start a new cycle
        };

        if (!validTransitions.TryGetValue(fromPhase, out TddPhase[]? allowedPhases))
        {
            return Task.FromResult(ResultExtensions.Success(false));
        }

        bool isValid = allowedPhases.Contains(toPhase);
        return Task.FromResult(ResultExtensions.Success(isValid));
    }

    public Task<Result> ClearFeatureStateAsync(string featureName)
    {
        if (string.IsNullOrWhiteSpace(featureName))
        {
            return Task.FromResult(Result.Failure("Feature name cannot be empty"));
        }

        _featureStates.TryRemove(featureName, out _);
        return Task.FromResult(Result.Success());
    }
}