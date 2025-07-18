using WorkFlo.Application.Common.CQRS;

namespace WorkFlo.Application.Common.Messaging;

/// <summary>
/// Abstraction for dispatching queries through the messaging pipeline.
/// This interface wraps the underlying messaging framework (MediatR, custom implementation, etc.)
/// to allow for easy swapping of dependencies.
/// </summary>
public interface IQueryDispatcher
{
    /// <summary>
    /// Sends a query and returns the response through the pipeline.
    /// </summary>
    /// <typeparam name="TQuery">The type of query to send</typeparam>
    /// <typeparam name="TResponse">The type of response expected</typeparam>
    /// <param name="query">The query to send</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the asynchronous operation with the response</returns>
    Task<TResponse> SendAsync<TQuery, TResponse>(TQuery query, CancellationToken cancellationToken = default)
        where TQuery : IQuery<TResponse>;
}
