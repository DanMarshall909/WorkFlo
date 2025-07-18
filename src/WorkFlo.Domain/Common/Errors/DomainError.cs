namespace WorkFlo.Domain.Common.Errors;

/// <summary>
/// Base implementation for domain errors
/// </summary>
public abstract record DomainError : IError
{
    protected DomainError(string code, string message, ErrorCategory category)
    {
        Code = code;
        Message = message;
        Category = category;
    }

    public string Code { get; }
    public string Message { get; }
    public ErrorCategory Category { get; }

    public override string ToString() => $"[{Category}] {Code}: {Message}";
}
