namespace WorkFlo.Domain.Common.Errors;

/// <summary>
/// Logical categories for domain errors
/// </summary>
public enum ErrorCategory
{
    /// <summary>
    /// None or unknown error category
    /// </summary>
    None = 0,

    /// <summary>
    /// Validation errors - input doesn't meet requirements
    /// </summary>
    Validation = 1,

    /// <summary>
    /// Business rule violations - operation not allowed by domain rules
    /// </summary>
    BusinessRule = 2,

    /// <summary>
    /// Authentication errors - user identity issues
    /// </summary>
    Authentication = 3,

    /// <summary>
    /// Authorization errors - user permission issues
    /// </summary>
    Authorization = 4,

    /// <summary>
    /// Not found errors - requested resource doesn't exist
    /// </summary>
    NotFound = 5,

    /// <summary>
    /// Conflict errors - operation conflicts with current state
    /// </summary>
    Conflict = 6,

    /// <summary>
    /// Privacy errors - data privacy violations
    /// </summary>
    Privacy = 7
}
