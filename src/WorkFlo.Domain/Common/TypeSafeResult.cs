using WorkFlo.Domain.Common.Errors;

namespace WorkFlo.Domain.Common;

/// <summary>
/// Type-safe result with strongly-typed error handling
/// </summary>
/// <typeparam name="T">Success value type</typeparam>
/// <typeparam name="TError">Error type</typeparam>
public sealed class TypeSafeResult<T, TError> where TError : IError
{
    private readonly T? _value;
    private readonly TError? _error;

    private TypeSafeResult(T value)
    {
        _value = value;
        _error = default;
        IsSuccess = true;
    }

    private TypeSafeResult(TError error)
    {
        _value = default;
        _error = error;
        IsSuccess = false;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    /// <summary>
    /// Gets the success value. Throws if result is failure.
    /// </summary>
    public T Value => IsSuccess ? _value! : throw new InvalidOperationException("Cannot access Value on a failed result");

    /// <summary>
    /// Gets the error. Throws if result is success.
    /// </summary>
    public TError Error => IsFailure ? _error! : throw new InvalidOperationException("Cannot access Error on a successful result");

    /// <summary>
    /// Safely gets the value if success, otherwise returns default
    /// </summary>
    public T? ValueOrDefault => IsSuccess ? _value : default;

    /// <summary>
    /// Safely gets the error if failure, otherwise returns default
    /// </summary>
    public TError? ErrorOrDefault => IsFailure ? _error : default;

    /// <summary>
    /// Creates a successful result
    /// </summary>
    public static TypeSafeResult<T, TError> Success(T value) => new(value);

    /// <summary>
    /// Creates a failed result
    /// </summary>
    public static TypeSafeResult<T, TError> Failure(TError error) => new(error);

    /// <summary>
    /// Pattern matching for result handling
    /// </summary>
    public TResult Match<TResult>(Func<T, TResult> onSuccess, Func<TError, TResult> onFailure)
    {
        return IsSuccess ? onSuccess(_value!) : onFailure(_error!);
    }

    /// <summary>
    /// Executes action based on result state
    /// </summary>
    public void Match(Action<T> onSuccess, Action<TError> onFailure)
    {
        if (IsSuccess)
        {
            onSuccess(_value!);
        }
        else
        {
            onFailure(_error!);
        }
    }

    /// <summary>
    /// Maps the success value to a new type
    /// </summary>
    public TypeSafeResult<TNewValue, TError> Map<TNewValue>(Func<T, TNewValue> mapper)
    {
        return IsSuccess
            ? TypeSafeResult<TNewValue, TError>.Success(mapper(_value!))
            : TypeSafeResult<TNewValue, TError>.Failure(_error!);
    }

    /// <summary>
    /// Maps the error to a new type
    /// </summary>
    public TypeSafeResult<T, TNewError> MapError<TNewError>(Func<TError, TNewError> mapper) where TNewError : IError
    {
        return IsSuccess
            ? TypeSafeResult<T, TNewError>.Success(_value!)
            : TypeSafeResult<T, TNewError>.Failure(mapper(_error!));
    }

    /// <summary>
    /// Chains results together (flatMap/bind)
    /// </summary>
    public TypeSafeResult<TNewValue, TError> Bind<TNewValue>(Func<T, TypeSafeResult<TNewValue, TError>> binder)
    {
        return IsSuccess ? binder(_value!) : TypeSafeResult<TNewValue, TError>.Failure(_error!);
    }

    /// <summary>
    /// Implicit conversion from success value
    /// </summary>
    public static implicit operator TypeSafeResult<T, TError>(T value) => Success(value);

    /// <summary>
    /// Implicit conversion from error
    /// </summary>
    public static implicit operator TypeSafeResult<T, TError>(TError error) => Failure(error);

    public override string ToString()
    {
        return IsSuccess ? $"Success({_value})" : $"Failure({_error})";
    }

    public TypeSafeResult<T, TError> ToTypeSafeResult()
    {
        throw new NotImplementedException();
    }
}

/// <summary>
/// Type-safe result without value (for operations that don't return data)
/// </summary>
/// <typeparam name="TError">Error type</typeparam>
public sealed class TypeSafeResult<TError> where TError : IError
{
    private readonly TError? _error;

    private TypeSafeResult(bool isSuccess, TError? error = default)
    {
        IsSuccess = isSuccess;
        _error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    /// <summary>
    /// Gets the error. Throws if result is success.
    /// </summary>
    public TError Error => IsFailure ? _error! : throw new InvalidOperationException("Cannot access Error on a successful result");

    /// <summary>
    /// Safely gets the error if failure, otherwise returns default
    /// </summary>
    public TError? ErrorOrDefault => IsFailure ? _error : default;

    /// <summary>
    /// Creates a successful result
    /// </summary>
    public static TypeSafeResult<TError> Success() => new(true);

    /// <summary>
    /// Creates a failed result
    /// </summary>
    public static TypeSafeResult<TError> Failure(TError error) => new(false, error);

    /// <summary>
    /// Pattern matching for result handling
    /// </summary>
    public TResult Match<TResult>(Func<TResult> onSuccess, Func<TError, TResult> onFailure)
    {
        return IsSuccess ? onSuccess() : onFailure(_error!);
    }

    /// <summary>
    /// Executes action based on result state
    /// </summary>
    public void Match(Action onSuccess, Action<TError> onFailure)
    {
        if (IsSuccess)
        {
            onSuccess();
        }
        else
        {
            onFailure(_error!);
        }
    }

    /// <summary>
    /// Converts to TypeSafeResult<T, TError> with a value
    /// </summary>
    public TypeSafeResult<T, TError> WithValue<T>(T value)
    {
        return IsSuccess
            ? TypeSafeResult<T, TError>.Success(value)
            : TypeSafeResult<T, TError>.Failure(_error!);
    }

    /// <summary>
    /// Implicit conversion from error
    /// </summary>
    public static implicit operator TypeSafeResult<TError>(TError error) => Failure(error);

    public override string ToString()
    {
        return IsSuccess ? "Success()" : $"Failure({_error})";
    }

    public TypeSafeResult<TError> ToTypeSafeResult()
    {
        throw new NotImplementedException();
    }
}
