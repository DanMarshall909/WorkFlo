using WorkFlo.Application.Common.Validation;
using FluentValidation.Results;

namespace WorkFlo.Application.Tests.Common.Behaviors;

[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "MA0048:File name must match type name",
    Justification = "Test helper class in test file")]
public class TestValidationResult : IValidationResult
{
    public TestValidationResult(ValidationResult fluentValidationResult)
    {
        IsValid = fluentValidationResult.IsValid;
        Errors = fluentValidationResult.Errors.Select(e =>
            new TestValidationFailure(e.PropertyName, e.ErrorMessage, e.AttemptedValue, e.ErrorCode)).ToList();
    }

    public bool IsValid { get; }
    public IReadOnlyList<IValidationFailure> Errors { get; }
    public string ErrorMessage => string.Join("; ", Errors.Select(e => e.ErrorMessage));
}
