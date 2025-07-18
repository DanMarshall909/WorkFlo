using WorkFlo.Application.Common.Validation;

namespace WorkFlo.Application.Tests.Common.Behaviors;

[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "MA0048:File name must match type name",
    Justification = "Test helper class in test file")]
public class TestValidationFailure : IValidationFailure
{
    public TestValidationFailure(string propertyName, string errorMessage, object? attemptedValue = null,
        string? errorCode = null)
    {
        PropertyName = propertyName;
        ErrorMessage = errorMessage;
        AttemptedValue = attemptedValue;
        ErrorCode = errorCode;
    }

    public string PropertyName { get; }
    public string ErrorMessage { get; }
    public object? AttemptedValue { get; }
    public string? ErrorCode { get; }
}
