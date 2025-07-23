using FluentValidation.Results;

namespace WorkFlo.Application.Common.Validation.Adapters;

/// <summary>
/// FluentValidation implementation of the validation result abstraction.
/// This adapter wraps FluentValidation's ValidationResult to provide validation result functionality.
/// </summary>
public class FluentValidationResultAdapter : IValidationResult
{
    private readonly ValidationResult _validationResult;
    private readonly Lazy<IReadOnlyList<IValidationFailure>> _errors;

    public FluentValidationResultAdapter(ValidationResult validationResult)
    {
        _validationResult = validationResult ?? throw new ArgumentNullException(nameof(validationResult));
        _errors = new(() => _validationResult.Errors
            .Select(error => new FluentValidationFailureAdapter(error))
            .Cast<IValidationFailure>()
            .ToList()
            .AsReadOnly());
    }

    /// <inheritdoc />
    public bool IsValid => _validationResult.IsValid;

    /// <inheritdoc />
    public IReadOnlyList<IValidationFailure> Errors => _errors.Value;

    /// <inheritdoc />
    public string ErrorMessage => string.Join("; ", Errors.Select(e => e.ErrorMessage));
}
