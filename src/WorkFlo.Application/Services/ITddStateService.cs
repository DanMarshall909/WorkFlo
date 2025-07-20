using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Services;

public interface ITddStateService
{
    Task<Result<TddPhase>> GetCurrentPhaseAsync(string featureName);
    Task<Result> SetPhaseAsync(string featureName, TddPhase phase);
    Task<Result<bool>> ValidatePhaseTransitionAsync(string featureName, TddPhase fromPhase, TddPhase toPhase);
    Task<Result> ClearFeatureStateAsync(string featureName);
}

public enum TddPhase
{
    None,
    Red,
    Green,
    Refactor,
    Cover,
    Mutation,
    Review,
    Done
}