using FluentValidation;

namespace WorkFlo.Application.Common.Validation.Adapters;

/// <summary>
/// FluentValidation implementation of the message validator abstraction.
/// This adapter wraps FluentValidation's IValidator to provide message validation functionality.
/// </summary>
/// <typeparam name="T">The type of message to validate</typeparam>
public class FluentValidationAdapter<T> : IMessageValidator<T>
{
    private readonly IValidator<T> _validator;

    public FluentValidationAdapter(IValidator<T> validator)
    {
        _validator = validator ?? throw new ArgumentNullException(nameof(validator));
    }

    /// <inheritdoc />
    public async Task<IValidationResult> ValidateAsync(T instance, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(instance);

        FluentValidation.Results.ValidationResult result =
            await _validator.ValidateAsync(instance, cancellationToken).ConfigureAwait(false);
        return new FluentValidationResultAdapter(result);
    }

    /// <inheritdoc />
    public IValidationResult Validate(T instance)
    {
        ArgumentNullException.ThrowIfNull(instance);

        FluentValidation.Results.ValidationResult result = _validator.Validate(instance);
        return new FluentValidationResultAdapter(result);
    }
}
