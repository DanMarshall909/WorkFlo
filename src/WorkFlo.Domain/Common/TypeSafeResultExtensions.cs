using WorkFlo.Domain.Common.Errors;

namespace WorkFlo.Domain.Common;

/// <summary>
/// Extension methods for creating TypeSafeResults without generic type inference issues
/// </summary>
public static class TypeSafeResultExtensions
{
    /// <summary>
    /// Creates a successful TypeSafeResult with value
    /// </summary>
    public static TypeSafeResult<T, TError> ToSuccess<T, TError>(this T value) where TError : IError
        => TypeSafeResult<T, TError>.Success(value);

    /// <summary>
    /// Creates a successful TypeSafeResult without value
    /// </summary>
    public static TypeSafeResult<TError> ToSuccessWithoutValue<TError>() where TError : IError
        => TypeSafeResult<TError>.Success();

    /// <summary>
    /// Creates a failed TypeSafeResult with error (with value)
    /// </summary>
    public static TypeSafeResult<T, TError> ToFailure<T, TError>(this TError error) where TError : IError
        => TypeSafeResult<T, TError>.Failure(error);

    /// <summary>
    /// Creates a failed TypeSafeResult without value
    /// </summary>
    public static TypeSafeResult<TError> ToFailureWithoutValue<TError>(this TError error) where TError : IError
        => TypeSafeResult<TError>.Failure(error);

    /// <summary>
    /// Converts old Result to TypeSafeResult with DomainError
    /// </summary>
    public static TypeSafeResult<T, DomainError> ToTypeSafe<T>(this Result<T> result)
    {
        if (result.IsSuccess)
        {
            return TypeSafeResult<T, DomainError>.Success(result.Value!);
        }

        // Convert string error to a generic domain error
        var error = new GenericDomainError(result.Error ?? "Unknown error");
        return TypeSafeResult<T, DomainError>.Failure(error);
    }

    /// <summary>
    /// Converts old Result to TypeSafeResult with DomainError
    /// </summary>
    public static TypeSafeResult<DomainError> ToTypeSafe(this Result result)
    {
        if (result.IsSuccess)
        {
            return TypeSafeResult<DomainError>.Success();
        }

        // Convert string error to a generic domain error
        var error = new GenericDomainError(result.Error ?? "Unknown error");
        return TypeSafeResult<DomainError>.Failure(error);
    }

    /// <summary>
    /// Generic domain error for backward compatibility
    /// </summary>
    private sealed record GenericDomainError(string Message) : DomainError("GENERIC_ERROR", Message, ErrorCategory.BusinessRule);
}
