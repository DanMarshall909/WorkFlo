namespace WorkFlo.Domain.Common.Errors;

/// <summary>
/// Business rule violation errors
/// </summary>
public abstract record BusinessRuleError : DomainError
{
    protected BusinessRuleError(string code, string message)
        : base(code, message, ErrorCategory.BusinessRule)
    {
    }

    public override string ToString() => $"[{Category}] {Code}: {Message}";

    /// <summary>
    /// Operation not allowed in current state
    /// </summary>
    public sealed record InvalidState(string Operation, string CurrentState)
        : BusinessRuleError("BUSINESS_INVALID_STATE", $"Cannot {Operation} when in state: {CurrentState}")
    {
        public override string ToString() => base.ToString();
    }

    /// <summary>
    /// Resource already exists when uniqueness is required
    /// </summary>
    public sealed record AlreadyExists(string ResourceType, string Identifier)
        : BusinessRuleError("BUSINESS_ALREADY_EXISTS", $"{ResourceType} with identifier '{Identifier}' already exists")
    {
        public override string ToString() => base.ToString();
    }

    /// <summary>
    /// Operation violates domain constraint
    /// </summary>
    public sealed record ConstraintViolation(string ConstraintName, string Description)
        : BusinessRuleError("BUSINESS_CONSTRAINT_VIOLATION", $"Domain constraint '{ConstraintName}' violated: {Description}")
    {
        public override string ToString() => base.ToString();
    }

    /// <summary>
    /// Operation requires different user state
    /// </summary>
    public sealed record InvalidUserState(string RequiredState, string CurrentState)
        : BusinessRuleError("BUSINESS_INVALID_USER_STATE", $"User must be '{RequiredState}' but is currently '{CurrentState}'")
    {
        public override string ToString() => base.ToString();
    }
}
