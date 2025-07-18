namespace WorkFlo.Domain.Common;

// Extension methods to create Result<T> without static members on generic type
public static class ResultExtensions
{
    public static Result<T> Success<T>(T value)
    {
        return Result<T>.CreateSuccess(value);
    }

    public static Result<T> Failure<T>(string error)
    {
        return Result<T>.CreateFailure(error);
    }

    public static bool IsFailure<T>(this Result<T> result)
    {
        return !result.IsSuccess;
    }

    public static bool IsFailure(this Result result)
    {
        return !result.IsSuccess;
    }
}
