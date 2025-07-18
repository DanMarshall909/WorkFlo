namespace WorkFlo.Domain.Common;

public sealed class Result<T>
{
    public T? Value { get; }
    public bool IsSuccess { get; }
    public string? Error { get; }

    private Result(T? value, bool isSuccess, string? error)
    {
        Value = value;
        IsSuccess = isSuccess;
        Error = error;
    }

    // Using instance factory methods to avoid CA1000
    internal static Result<T> CreateSuccess(T value)
    {
        return new(value, true, null);
    }

    internal static Result<T> CreateFailure(string error)
    {
        return new(default, false, error);
    }
}

public sealed class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }

    private Result(bool isSuccess, string? error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success()
    {
        return new(true, null);
    }

    public static Result Failure(string error)
    {
        return new(false, error);
    }
}
