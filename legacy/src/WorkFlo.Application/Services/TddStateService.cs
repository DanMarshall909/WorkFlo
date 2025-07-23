using System.Collections.Concurrent;
using System.Linq;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Services;

public class TddStateService : ITddStateService
{
    private readonly ConcurrentDictionary<string, (TddPhase Phase, DateTime LastUpdated)> _featureStates = new(StringComparer.Ordinal);
    private readonly Timer _cleanupTimer;
    private readonly TimeSpan _stateTimeout = TimeSpan.FromHours(24);

    public TddStateService()
    {
        // Run cleanup every hour
        _cleanupTimer = new Timer(CleanupStaleStates, null, TimeSpan.FromHours(1), TimeSpan.FromHours(1));
    }

    public Task<Result<TddPhase>> GetCurrentPhaseAsync(string featureName)
    {
        if (string.IsNullOrWhiteSpace(featureName))
        {
            return Task.FromResult(ResultExtensions.Failure<TddPhase>("Feature name cannot be empty"));
        }

        if (_featureStates.TryGetValue(featureName, out (TddPhase Phase, DateTime LastUpdated) state))
        {
            return Task.FromResult(ResultExtensions.Success(state.Phase));
        }

        return Task.FromResult(ResultExtensions.Success(TddPhase.None));
    }

    public Task<Result> SetPhaseAsync(string featureName, TddPhase phase)
    {
        if (string.IsNullOrWhiteSpace(featureName))
        {
            return Task.FromResult(Result.Failure("Feature name cannot be empty"));
        }

        DateTime now = DateTime.UtcNow;
        _featureStates.AddOrUpdate(featureName, (phase, now), (_, _) => (phase, now));
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

    private void CleanupStaleStates(object? state)
    {
        DateTime cutoff = DateTime.UtcNow - _stateTimeout;
        List<string> staleKeys = new();

        foreach (KeyValuePair<string, (TddPhase Phase, DateTime LastUpdated)> kvp in _featureStates)
        {
            if (kvp.Value.LastUpdated < cutoff)
            {
                staleKeys.Add(kvp.Key);
            }
        }

        foreach (string key in staleKeys)
        {
            _featureStates.TryRemove(key, out _);
        }
    }

    public void Dispose()
    {
        _cleanupTimer?.Dispose();
    }
}
