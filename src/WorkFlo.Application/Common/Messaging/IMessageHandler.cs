namespace WorkFlo.Application.Common.Messaging;

/// <summary>
/// Abstraction for message handlers that process commands and queries.
/// This interface wraps the underlying messaging framework handlers to allow for easy swapping of dependencies.
/// </summary>
/// <typeparam name="TMessage">The type of message to handle</typeparam>
/// <typeparam name="TResponse">The type of response to return</typeparam>
public interface IMessageHandler<in TMessage, TResponse>
{
    /// <summary>
    /// Handles the specified message and returns a response.
    /// </summary>
    /// <param name="message">The message to handle</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the asynchronous operation with the response</returns>
    Task<TResponse> HandleAsync(TMessage message, CancellationToken cancellationToken = default);
}

/// <summary>
/// Abstraction for message handlers that process commands without returning a response.
/// </summary>
/// <typeparam name="TMessage">The type of message to handle</typeparam>
public interface IMessageHandler<in TMessage>
{
    /// <summary>
    /// Handles the specified message.
    /// </summary>
    /// <param name="message">The message to handle</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the asynchronous operation</returns>
    Task HandleAsync(TMessage message, CancellationToken cancellationToken = default);
}
