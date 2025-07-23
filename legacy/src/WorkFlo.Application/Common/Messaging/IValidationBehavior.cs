namespace WorkFlo.Application.Common.Messaging;

/// <summary>
/// Abstraction for validation behavior in the messaging pipeline.
/// This interface wraps the underlying validation pipeline behavior to allow for easy swapping of dependencies.
/// </summary>
/// <typeparam name="TMessage">The type of message being validated</typeparam>
/// <typeparam name="TResponse">The type of response from the handler</typeparam>
public interface IValidationBehavior<in TMessage, TResponse>
{
    /// <summary>
    /// Handles the message through the validation pipeline.
    /// </summary>
    /// <param name="message">The message to validate</param>
    /// <param name="next">The next handler in the pipeline</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the asynchronous operation with the response</returns>
    Task<TResponse> HandleAsync(
        TMessage message,
        Func<Task<TResponse>> next,
        CancellationToken cancellationToken = default);
}
