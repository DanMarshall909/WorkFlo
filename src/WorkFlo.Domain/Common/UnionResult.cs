using WorkFlo.Domain.Common.Errors;

namespace WorkFlo.Domain.Common;

/// <summary>
/// Union result supporting multiple success types with type-safe error handling
/// </summary>
/// <typeparam name="T1">First possible success type</typeparam>
/// <typeparam name="T2">Second possible success type</typeparam>
/// <typeparam name="TError">Error type</typeparam>
public sealed class UnionResult<T1, T2, TError> where TError : IError
{
    private readonly object? _value;
    private readonly TError? _error;
    private readonly int _index; // 0 = error, 1 = T1, 2 = T2

    private UnionResult(T1 value)
    {
        _value = value;
        _error = default;
        _index = 1;
        IsSuccess = true;
    }

    private UnionResult(T2 value)
    {
        _value = value;
        _error = default;
        _index = 2;
        IsSuccess = true;
    }

    private UnionResult(TError error)
    {
        _value = default;
        _error = error;
        _index = 0;
        IsSuccess = false;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    /// <summary>
    /// Checks if the result contains a value of type T1
    /// </summary>
    public bool IsT1 => _index == 1;

    /// <summary>
    /// Checks if the result contains a value of type T2
    /// </summary>
    public bool IsT2 => _index == 2;

    /// <summary>
    /// Gets the T1 value. Throws if not T1.
    /// </summary>
    public T1 AsT1 => IsT1 ? (T1)_value! : throw new InvalidOperationException($"Cannot access T1 value when result is {(_index == 0 ? "error" : "T2")}");

    /// <summary>
    /// Gets the T2 value. Throws if not T2.
    /// </summary>
    public T2 AsT2 => IsT2 ? (T2)_value! : throw new InvalidOperationException($"Cannot access T2 value when result is {(_index == 0 ? "error" : "T1")}");

    /// <summary>
    /// Gets the error. Throws if not an error.
    /// </summary>
    public TError Error => IsFailure ? _error! : throw new InvalidOperationException("Cannot access Error on a successful result");

    /// <summary>
    /// Safely gets T1 value or default
    /// </summary>
    public T1? T1OrDefault => IsT1 ? (T1)_value! : default;

    /// <summary>
    /// Safely gets T2 value or default
    /// </summary>
    public T2? T2OrDefault => IsT2 ? (T2)_value! : default;

    /// <summary>
    /// Safely gets error or default
    /// </summary>
    public TError? ErrorOrDefault => IsFailure ? _error : default;

    /// <summary>
    /// Creates a successful result with T1 value
    /// </summary>
    public static UnionResult<T1, T2, TError> FromT1(T1 value) => new(value);

    /// <summary>
    /// Creates a successful result with T2 value
    /// </summary>
    public static UnionResult<T1, T2, TError> FromT2(T2 value) => new(value);

    /// <summary>
    /// Creates a failed result with error
    /// </summary>
    public static UnionResult<T1, T2, TError> FromError(TError error) => new(error);

    /// <summary>
    /// Pattern matching for union result handling
    /// </summary>
    public TResult Match<TResult>(
        Func<T1, TResult> onT1,
        Func<T2, TResult> onT2,
        Func<TError, TResult> onError)
    {
        return _index switch
        {
            1 => onT1((T1)_value!),
            2 => onT2((T2)_value!),
            0 => onError(_error!),
            _ => throw new InvalidOperationException("Invalid union state")
        };
    }

    /// <summary>
    /// Pattern matching with actions
    /// </summary>
    public void Match(
        Action<T1> onT1,
        Action<T2> onT2,
        Action<TError> onError)
    {
        switch (_index)
        {
            case 1:
                onT1((T1)_value!);
                break;
            case 2:
                onT2((T2)_value!);
                break;
            case 0:
                onError(_error!);
                break;
            default:
                throw new InvalidOperationException("Invalid union state");
        }
    }

    /// <summary>
    /// Maps T1 to a new type
    /// </summary>
    public UnionResult<TNewT1, T2, TError> MapT1<TNewT1>(Func<T1, TNewT1> mapper)
    {
        return _index switch
        {
            1 => UnionResult<TNewT1, T2, TError>.FromT1(mapper((T1)_value!)),
            2 => UnionResult<TNewT1, T2, TError>.FromT2((T2)_value!),
            0 => UnionResult<TNewT1, T2, TError>.FromError(_error!),
            _ => throw new InvalidOperationException("Invalid union state")
        };
    }

    /// <summary>
    /// Maps T2 to a new type
    /// </summary>
    public UnionResult<T1, TNewT2, TError> MapT2<TNewT2>(Func<T2, TNewT2> mapper)
    {
        return _index switch
        {
            1 => UnionResult<T1, TNewT2, TError>.FromT1((T1)_value!),
            2 => UnionResult<T1, TNewT2, TError>.FromT2(mapper((T2)_value!)),
            0 => UnionResult<T1, TNewT2, TError>.FromError(_error!),
            _ => throw new InvalidOperationException("Invalid union state")
        };
    }

    /// <summary>
    /// Maps the error to a new type
    /// </summary>
    public UnionResult<T1, T2, TNewError> MapError<TNewError>(Func<TError, TNewError> mapper) where TNewError : IError
    {
        return _index switch
        {
            1 => UnionResult<T1, T2, TNewError>.FromT1((T1)_value!),
            2 => UnionResult<T1, T2, TNewError>.FromT2((T2)_value!),
            0 => UnionResult<T1, T2, TNewError>.FromError(mapper(_error!)),
            _ => throw new InvalidOperationException("Invalid union state")
        };
    }

    /// <summary>
    /// Implicit conversion from T1
    /// </summary>
    public static implicit operator UnionResult<T1, T2, TError>(T1 value) => FromT1(value);

    /// <summary>
    /// Implicit conversion from T2
    /// </summary>
    public static implicit operator UnionResult<T1, T2, TError>(T2 value) => FromT2(value);

    /// <summary>
    /// Implicit conversion from error
    /// </summary>
    public static implicit operator UnionResult<T1, T2, TError>(TError error) => FromError(error);

    public override string ToString()
    {
        return _index switch
        {
            1 => $"T1({_value})",
            2 => $"T2({_value})",
            0 => $"Error({_error})",
            _ => "Invalid"
        };
    }

    public UnionResult<T1, T2, TError> ToUnionResult()
    {
        throw new NotImplementedException();
    }
}

/// <summary>
/// Union result supporting three success types with type-safe error handling
/// </summary>
/// <typeparam name="T1">First possible success type</typeparam>
/// <typeparam name="T2">Second possible success type</typeparam>
/// <typeparam name="T3">Third possible success type</typeparam>
/// <typeparam name="TError">Error type</typeparam>
public sealed class UnionResult<T1, T2, T3, TError> where TError : IError
{
    private readonly object? _value;
    private readonly TError? _error;
    private readonly int _index; // 0 = error, 1 = T1, 2 = T2, 3 = T3

    private UnionResult(T1 value)
    {
        _value = value;
        _error = default;
        _index = 1;
        IsSuccess = true;
    }

    private UnionResult(T2 value)
    {
        _value = value;
        _error = default;
        _index = 2;
        IsSuccess = true;
    }

    private UnionResult(T3 value)
    {
        _value = value;
        _error = default;
        _index = 3;
        IsSuccess = true;
    }

    private UnionResult(TError error)
    {
        _value = default;
        _error = error;
        _index = 0;
        IsSuccess = false;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    public bool IsT1 => _index == 1;
    public bool IsT2 => _index == 2;
    public bool IsT3 => _index == 3;

    public T1 AsT1 => IsT1 ? (T1)_value! : throw new InvalidOperationException($"Cannot access T1 value when result is {GetCurrentType()}");
    public T2 AsT2 => IsT2 ? (T2)_value! : throw new InvalidOperationException($"Cannot access T2 value when result is {GetCurrentType()}");
    public T3 AsT3 => IsT3 ? (T3)_value! : throw new InvalidOperationException($"Cannot access T3 value when result is {GetCurrentType()}");
    public TError Error => IsFailure ? _error! : throw new InvalidOperationException("Cannot access Error on a successful result");

    public T1? T1OrDefault => IsT1 ? (T1)_value! : default;
    public T2? T2OrDefault => IsT2 ? (T2)_value! : default;
    public T3? T3OrDefault => IsT3 ? (T3)_value! : default;
    public TError? ErrorOrDefault => IsFailure ? _error : default;

    private string GetCurrentType() => _index switch
    {
        0 => "error",
        1 => "T1",
        2 => "T2",
        3 => "T3",
        _ => "invalid"
    };

    public static UnionResult<T1, T2, T3, TError> FromT1(T1 value) => new(value);
    public static UnionResult<T1, T2, T3, TError> FromT2(T2 value) => new(value);
    public static UnionResult<T1, T2, T3, TError> FromT3(T3 value) => new(value);
    public static UnionResult<T1, T2, T3, TError> FromError(TError error) => new(error);

    public TResult Match<TResult>(
        Func<T1, TResult> onT1,
        Func<T2, TResult> onT2,
        Func<T3, TResult> onT3,
        Func<TError, TResult> onError)
    {
        return _index switch
        {
            1 => onT1((T1)_value!),
            2 => onT2((T2)_value!),
            3 => onT3((T3)_value!),
            0 => onError(_error!),
            _ => throw new InvalidOperationException("Invalid union state")
        };
    }

    public void Match(
        Action<T1> onT1,
        Action<T2> onT2,
        Action<T3> onT3,
        Action<TError> onError)
    {
        switch (_index)
        {
            case 1:
                onT1((T1)_value!);
                break;
            case 2:
                onT2((T2)_value!);
                break;
            case 3:
                onT3((T3)_value!);
                break;
            case 0:
                onError(_error!);
                break;
            default:
                throw new InvalidOperationException("Invalid union state");
        }
    }

    public static implicit operator UnionResult<T1, T2, T3, TError>(T1 value) => FromT1(value);
    public static implicit operator UnionResult<T1, T2, T3, TError>(T2 value) => FromT2(value);
    public static implicit operator UnionResult<T1, T2, T3, TError>(T3 value) => FromT3(value);
    public static implicit operator UnionResult<T1, T2, T3, TError>(TError error) => FromError(error);

    public override string ToString()
    {
        return _index switch
        {
            1 => $"T1({_value})",
            2 => $"T2({_value})",
            3 => $"T3({_value})",
            0 => $"Error({_error})",
            _ => "Invalid"
        };
    }

    public UnionResult<T1, T2, T3, TError> ToUnionResult()
    {
        throw new NotImplementedException();
    }
}
