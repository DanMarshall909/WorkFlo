using MediatR;

namespace WorkFlo.Application.Common.CQRS;

/// <summary>
/// Interface for handlers that process queries and return data.
/// Query handlers should not modify the state of the system.
/// </summary>
/// <typeparam name="TQuery">The type of query to handle</typeparam>
/// <typeparam name="TResponse">The type of response to return</typeparam>
public interface IQueryHandler<in TQuery, TResponse> : IRequestHandler<TQuery, TResponse>
    where TQuery : IQuery<TResponse>;
