namespace WorkFlo.Application.Common.Validation;

/// <summary>
/// Abstraction for validation failures.
/// This interface wraps the underlying validation framework failure details to allow for easy swapping of dependencies.
/// </summary>
public interface IValidationFailure
{
    /// <summary>
    /// Gets the name of the property that failed validation.
    /// </summary>
    string PropertyName { get; }

    /// <summary>
    /// Gets the error message for the validation failure.
    /// </summary>
    string ErrorMessage { get; }

    /// <summary>
    /// Gets the attempted value that failed validation.
    /// </summary>
    object? AttemptedValue { get; }

    /// <summary>
    /// Gets the error code for the validation failure.
    /// </summary>
    string? ErrorCode { get; }
}
