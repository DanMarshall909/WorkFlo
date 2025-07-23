using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace WorkFlo.Application.Common.Validation.Adapters;

/// <summary>
/// FluentValidation implementation of the validator provider abstraction.
/// This adapter wraps FluentValidation's service collection integration to provide validator discovery.
/// </summary>
public class FluentValidatorProvider : IValidatorProvider
{
    private readonly IServiceProvider _serviceProvider;

    public FluentValidatorProvider(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
    }

    /// <inheritdoc />
    public IEnumerable<IMessageValidator<T>> GetValidators<T>()
    {
        IEnumerable<IValidator<T>> fluentValidators = _serviceProvider.GetServices<IValidator<T>>();
        return fluentValidators.Select(validator => new FluentValidationAdapter<T>(validator));
    }

    /// <inheritdoc />
    public IEnumerable<object> GetValidators(Type messageType)
    {
        Type validatorType = typeof(IValidator<>).MakeGenericType(messageType);
        IEnumerable<object?> validators = _serviceProvider.GetServices(validatorType);

        foreach (object? validator in validators)
        {
            Type adapterType = typeof(FluentValidationAdapter<>).MakeGenericType(messageType);
            object? adapter = Activator.CreateInstance(adapterType, validator);
            if (adapter != null)
            {
                yield return adapter;
            }
        }
    }
}
