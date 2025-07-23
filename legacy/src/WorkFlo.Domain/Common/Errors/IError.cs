namespace WorkFlo.Domain.Common.Errors;

/// <summary>
/// Base interface for all domain errors
/// </summary>
public interface IError
{
    /// <summary>
    /// Unique error code for the specific error
    /// </summary>
    string Code { get; }

    /// <summary>
    /// Human-readable error message
    /// </summary>
    string Message { get; }

    /// <summary>
    /// Error category for logical grouping
    /// </summary>
    ErrorCategory Category { get; }
}
