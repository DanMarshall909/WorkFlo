namespace WorkFlo.Application.Common.Validation;

/// <summary>
/// Abstraction for providing validators for specific message types.
/// This interface wraps the underlying validation framework discovery mechanism.
/// </summary>
public interface IValidatorProvider
{
    /// <summary>
    /// Gets all validators for the specified message type.
    /// </summary>
    /// <typeparam name="T">The type of message to get validators for</typeparam>
    /// <returns>A collection of validators for the specified type</returns>
    IEnumerable<IMessageValidator<T>> GetValidators<T>();

    /// <summary>
    /// Gets all validators for the specified message type.
    /// </summary>
    /// <param name="messageType">The type of message to get validators for</param>
    /// <returns>A collection of validators for the specified type</returns>
    IEnumerable<object> GetValidators(Type messageType);
}
