using MediatR;

namespace WorkFlo.Application.Common.CQRS;

/// <summary>
/// Enhanced query interface that enforces nested response pattern for better organization.
/// </summary>
/// <typeparam name="TResponse">The response type that must be nested within the query</typeparam>
public interface ISelfContainedQuery<TResponse> : IRequest<TResponse>
    where TResponse : class
{
    /// <summary>
    /// Gets the query type name for logging and telemetry
    /// </summary>
    static virtual string QueryName => typeof(ISelfContainedQuery<TResponse>).Name;

    /// <summary>
    /// Gets the response type name for validation and serialization
    /// </summary>
    static virtual string ResponseName => typeof(TResponse).Name;
}
