namespace WorkFlo.Application.Common.Validation;

/// <summary>
/// Abstraction for validating messages (commands and queries).
/// This interface wraps the underlying validation framework (FluentValidation, DataAnnotations, etc.)
/// to allow for easy swapping of dependencies.
/// </summary>
/// <typeparam name="T">The type of message to validate</typeparam>
public interface IMessageValidator<in T>
{
    /// <summary>
    /// Validates the specified message asynchronously.
    /// </summary>
    /// <param name="instance">The message instance to validate</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the asynchronous validation operation with the result</returns>
    Task<IValidationResult> ValidateAsync(T instance, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates the specified message synchronously.
    /// </summary>
    /// <param name="instance">The message instance to validate</param>
    /// <returns>The validation result</returns>
    IValidationResult Validate(T instance);
}
