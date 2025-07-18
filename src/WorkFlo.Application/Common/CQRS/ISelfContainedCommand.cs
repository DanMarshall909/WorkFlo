using WorkFlo.Domain.Common;
using MediatR;

namespace WorkFlo.Application.Common.CQRS;

/// <summary>
/// Enhanced command interface that enforces nested response pattern and provides metadata access.
/// Commands implementing this interface must define their response as a nested type.
/// </summary>
/// <typeparam name="TResponse">The response type that must be nested within the command</typeparam>
public interface ISelfContainedCommand<TResponse> : IRequest<Result<TResponse>>
    where TResponse : class
{
    /// <summary>
    /// Gets the command type name for logging and telemetry
    /// </summary>
    static virtual string CommandName => typeof(ISelfContainedCommand<TResponse>).Name;

    /// <summary>
    /// Gets the response type name for validation and serialization
    /// </summary>
    static virtual string ResponseName => typeof(TResponse).Name;

    /// <summary>
    /// Validates the command structure at compile time to ensure Response is nested
    /// </summary>
    static virtual void ValidateStructure()
    {
        Type commandType = typeof(ISelfContainedCommand<TResponse>);
        Type responseType = typeof(TResponse);

        // Ensure response type is nested within the command type
        if (responseType.DeclaringType != commandType)
        {
            throw new InvalidOperationException(
                $"Response type {responseType.Name} must be nested within command type {commandType.Name}");
        }
    }
}
