using WorkFlo.Application.Common.CQRS;
using MediatR;

namespace WorkFlo.Application.Common.Messaging.Adapters;

/// <summary>
/// MediatR implementation of the query dispatcher abstraction.
/// This adapter wraps MediatR's IMediator to provide query dispatching functionality.
/// </summary>
public class MediatRQueryDispatcher : IQueryDispatcher
{
    private readonly IMediator _mediator;

    public MediatRQueryDispatcher(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    /// <inheritdoc />
    public Task<TResponse> SendAsync<TQuery, TResponse>(TQuery query, CancellationToken cancellationToken = default)
        where TQuery : IQuery<TResponse>
    {
        ArgumentNullException.ThrowIfNull(query);
        return _mediator.Send(query, cancellationToken);
    }
}
