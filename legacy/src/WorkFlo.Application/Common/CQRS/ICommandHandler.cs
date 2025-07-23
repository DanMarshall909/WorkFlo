using MediatR;

namespace WorkFlo.Application.Common.CQRS;

/// <summary>
/// Interface for handlers that process commands without returning a response.
/// </summary>
/// <typeparam name="TCommand">The type of command to handle</typeparam>
public interface ICommandHandler<in TCommand> : IRequestHandler<TCommand>
    where TCommand : ICommand;

/// <summary>
/// Interface for handlers that process commands and return a response.
/// </summary>
/// <typeparam name="TCommand">The type of command to handle</typeparam>
/// <typeparam name="TResponse">The type of response to return</typeparam>
public interface ICommandHandler<in TCommand, TResponse> : IRequestHandler<TCommand, TResponse>
    where TCommand : ICommand<TResponse>;
