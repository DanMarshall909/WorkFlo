namespace WorkFlo.Application.Common.Validation;

/// <summary>
/// Abstraction for validation results.
/// This interface wraps the underlying validation framework results to allow for easy swapping of dependencies.
/// </summary>
public interface IValidationResult
{
    /// <summary>
    /// Gets a value indicating whether the validation was successful.
    /// </summary>
    bool IsValid { get; }

    /// <summary>
    /// Gets the collection of validation failures.
    /// </summary>
    IReadOnlyList<IValidationFailure> Errors { get; }

    /// <summary>
    /// Gets a string representation of all validation errors.
    /// </summary>
    string ErrorMessage { get; }
}
