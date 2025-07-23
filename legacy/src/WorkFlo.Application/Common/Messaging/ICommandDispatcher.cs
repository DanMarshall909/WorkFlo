using WorkFlo.Application.Common.CQRS;

namespace WorkFlo.Application.Common.Messaging;

/// <summary>
/// Abstraction for dispatching commands through the messaging pipeline.
/// This interface wraps the underlying messaging framework (MediatR, custom implementation, etc.)
/// to allow for easy swapping of dependencies.
/// </summary>
public interface ICommandDispatcher
{
    /// <summary>
    /// Sends a command that doesn't return a response through the pipeline.
    /// </summary>
    /// <param name="command">The command to send</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the asynchronous operation</returns>
    Task SendAsync<TCommand>(TCommand command, CancellationToken cancellationToken = default)
        where TCommand : ICommand;

    /// <summary>
    /// Sends a command that returns a response through the pipeline.
    /// </summary>
    /// <typeparam name="TCommand">The type of command to send</typeparam>
    /// <typeparam name="TResponse">The type of response expected</typeparam>
    /// <param name="command">The command to send</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the asynchronous operation with the response</returns>
    Task<TResponse> SendAsync<TCommand, TResponse>(TCommand command, CancellationToken cancellationToken = default)
        where TCommand : ICommand<TResponse>;
}
