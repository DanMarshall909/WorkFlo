using FluentValidation.Results;

namespace WorkFlo.Application.Common.Validation.Adapters;

/// <summary>
/// FluentValidation implementation of the validation failure abstraction.
/// This adapter wraps FluentValidation's ValidationFailure to provide validation failure functionality.
/// </summary>
public class FluentValidationFailureAdapter : IValidationFailure
{
    private readonly ValidationFailure _validationFailure;

    public FluentValidationFailureAdapter(ValidationFailure validationFailure)
    {
        _validationFailure = validationFailure ?? throw new ArgumentNullException(nameof(validationFailure));
    }

    /// <inheritdoc />
    public string PropertyName => _validationFailure.PropertyName;

    /// <inheritdoc />
    public string ErrorMessage => _validationFailure.ErrorMessage;

    /// <inheritdoc />
    public object? AttemptedValue => _validationFailure.AttemptedValue;

    /// <inheritdoc />
    public string? ErrorCode => _validationFailure.ErrorCode;
}
