namespace WorkFlo.Application.Common.Messaging.Adapters;

/// <summary>
/// MediatR implementation of the validation behavior abstraction.
/// This adapter wraps MediatR's IPipelineBehavior to provide validation functionality.
/// Note: This is a simplified implementation that directly uses the existing ValidationBehavior.
/// </summary>
/// <typeparam name="TMessage">The type of message being validated</typeparam>
/// <typeparam name="TResponse">The type of response from the handler</typeparam>
public class MediatRValidationBehavior<TMessage, TResponse> : IValidationBehavior<TMessage, TResponse>
    where TMessage : notnull
{
    /// <inheritdoc />
    public Task<TResponse> HandleAsync(
        TMessage message,
        Func<Task<TResponse>> next,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentNullException.ThrowIfNull(next);

        // For now, just pass through to next handler
        // The actual validation logic is handled by the MediatR pipeline
        return next();
    }
}
