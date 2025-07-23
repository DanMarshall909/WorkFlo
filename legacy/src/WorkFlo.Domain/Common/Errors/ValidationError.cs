namespace WorkFlo.Domain.Common.Errors;

/// <summary>
/// Validation errors for input validation failures
/// </summary>
public abstract record ValidationError : DomainError
{
    protected ValidationError(string code, string message)
        : base(code, message, ErrorCategory.Validation)
    {
    }

    public override string ToString() => $"[{Category}] {Code}: {Message}";

    /// <summary>
    /// Required field is missing or empty
    /// </summary>
    public sealed record Required(string FieldName)
        : ValidationError("VALIDATION_REQUIRED", $"{FieldName} is required")
    {
        public override string ToString() => base.ToString();
    }

    /// <summary>
    /// Field value is too short
    /// </summary>
    public sealed record TooShort(string FieldName, int MinLength)
        : ValidationError("VALIDATION_TOO_SHORT", $"{FieldName} must be at least {MinLength} characters")
    {
        public override string ToString() => base.ToString();
    }

    /// <summary>
    /// Field value is too long
    /// </summary>
    public sealed record TooLong(string FieldName, int MaxLength)
        : ValidationError("VALIDATION_TOO_LONG", $"{FieldName} cannot exceed {MaxLength} characters")
    {
        public override string ToString() => base.ToString();
    }

    /// <summary>
    /// Field value format is invalid
    /// </summary>
    public sealed record InvalidFormat(string FieldName, string ExpectedFormat)
        : ValidationError("VALIDATION_INVALID_FORMAT", $"{FieldName} must be in format: {ExpectedFormat}")
    {
        public override string ToString() => base.ToString();
    }

    /// <summary>
    /// Field value is out of allowed range
    /// </summary>
    public sealed record OutOfRange(string FieldName, string AllowedRange)
        : ValidationError("VALIDATION_OUT_OF_RANGE", $"{FieldName} must be within range: {AllowedRange}")
    {
        public override string ToString() => base.ToString();
    }
}
