using WorkFlo.Application.Common.CQRS;
using MediatR;

namespace WorkFlo.Application.Common.Messaging.Adapters;

/// <summary>
/// MediatR implementation of the command dispatcher abstraction.
/// This adapter wraps MediatR's IMediator to provide command dispatching functionality.
/// </summary>
public class MediatRCommandDispatcher : ICommandDispatcher
{
    private readonly IMediator _mediator;

    public MediatRCommandDispatcher(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    /// <inheritdoc />
    public Task SendAsync<TCommand>(TCommand command, CancellationToken cancellationToken = default)
        where TCommand : ICommand
    {
        ArgumentNullException.ThrowIfNull(command);
        return _mediator.Send(command, cancellationToken);
    }

    /// <inheritdoc />
    public Task<TResponse> SendAsync<TCommand, TResponse>(TCommand command,
        CancellationToken cancellationToken = default)
        where TCommand : ICommand<TResponse>
    {
        ArgumentNullException.ThrowIfNull(command);
        return _mediator.Send(command, cancellationToken);
    }
}
