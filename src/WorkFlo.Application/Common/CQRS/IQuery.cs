using MediatR;

namespace WorkFlo.Application.Common.CQRS;

/// <summary>
/// Interface for queries that return data.
/// Queries should not modify the state of the system.
/// </summary>
/// <typeparam name="TResponse">The type of response returned by the query</typeparam>
[System.Diagnostics.CodeAnalysis.SuppressMessage("Design", "CA1040:Avoid empty interfaces",
    Justification = "Marker interface for CQRS pattern")]
public interface IQuery<out TResponse> : IRequest<TResponse>;
