# XML Documentation Guide

## Overview
This guide provides examples of how to properly document public APIs in WorkFlo.

## Examples

### Classes
```csharp
/// <summary>
/// Represents a validation rule for git commits.
/// </summary>
/// <remarks>
/// This class implements the IValidationRule interface to provide
/// custom validation logic for git commits in the WorkFlo system.
/// </remarks>
public class CommitValidationRule : IValidationRule
{
    // Implementation
}
```

### Methods
```csharp
/// <summary>
/// Validates the provided git commit message against configured rules.
/// </summary>
/// <param name="message">The commit message to validate.</param>
/// <param name="cancellationToken">Token to cancel the operation.</param>
/// <returns>A validation result indicating success or failure with error details.</returns>
/// <exception cref="ArgumentNullException">Thrown when message is null.</exception>
public async Task<ValidationResult> ValidateAsync(string message, CancellationToken cancellationToken)
{
    // Implementation
}
```

### Properties
```csharp
/// <summary>
/// Gets or sets the maximum number of files allowed in a single commit.
/// </summary>
/// <value>
/// The maximum file count. Default is 3.
/// </value>
public int MaxFileCount { get; set; } = 3;
```

### Interfaces
```csharp
/// <summary>
/// Defines the contract for validation rules in the WorkFlo system.
/// </summary>
public interface IValidationRule
{
    /// <summary>
    /// Validates the input according to the rule's logic.
    /// </summary>
    /// <param name="input">The input to validate.</param>
    /// <returns>True if validation passes; otherwise, false.</returns>
    bool Validate(string input);
}
```

## Best Practices

1. Always document public APIs
2. Use complete sentences with proper punctuation
3. Include parameter descriptions for all parameters
4. Document return values clearly
5. List possible exceptions
6. Add remarks for complex behavior
7. Include code examples for complex APIs
