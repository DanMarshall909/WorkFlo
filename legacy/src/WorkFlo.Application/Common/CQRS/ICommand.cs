using MediatR;

namespace WorkFlo.Application.Common.CQRS;

/// <summary>
/// Marker interface for commands that don't return a response.
/// Commands represent actions that change the state of the system.
/// </summary>
[System.Diagnostics.CodeAnalysis.SuppressMessage("Design", "CA1040:Avoid empty interfaces",
    Justification = "Marker interface for CQRS pattern")]
public interface ICommand : IRequest;

/// <summary>
/// Interface for commands that return a response.
/// Commands represent actions that change the state of the system.
/// </summary>
/// <typeparam name="TResponse">The type of response returned by the command</typeparam>
[System.Diagnostics.CodeAnalysis.SuppressMessage("Design", "CA1040:Avoid empty interfaces",
    Justification = "Marker interface for CQRS pattern")]
public interface ICommand<out TResponse> : IRequest<TResponse>;
