using WorkFlo.Application.Common.Behaviors;
using WorkFlo.Application.Common.Validation;
using WorkFlo.Domain.Common;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using NSubstitute;
using Xunit;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Tests.Common.Behaviors;

public class ValidationBehaviorTests
{
    private readonly IMessageValidator<TestCommand> _validator = Substitute.For<IMessageValidator<TestCommand>>();

    private readonly RequestHandlerDelegate<Result<string>> _next =
        Substitute.For<RequestHandlerDelegate<Result<string>>>();

    private readonly ValidationBehavior<TestCommand, Result<string>> _behavior;

    public ValidationBehaviorTests()
    {
        var validatorProvider = CreateValidatorProvider(_validator);
        _behavior = new(validatorProvider);
    }

    [Fact]
    public async Task When_validation_passes_should_call_next_handler_Async()
    {
        // Arrange
        var command = new TestCommand { TestData = "valid data" };
        var expectedResult = Success("handled");

        _validator.ValidateAsync(command, Arg.Any<CancellationToken>())
            .Returns(new TestValidationResult(new ValidationResult()));

        _next().Returns(expectedResult);

        // Act
        var result = await _behavior.Handle(command, _next, CancellationToken.None);

        // Assert
        result.Should().Be(expectedResult);
        await _next.Received(1)();
    }

    [Fact]
    public async Task When_validation_fails_should_return_failure_without_calling_next_Async()
    {
        // Arrange
        var command = new TestCommand { TestData = "invalid data" };
        var validationFailures = new[]
        {
            new ValidationFailure("TestData", "TestData is required"),
            new ValidationFailure("TestData", "TestData must be at least 5 characters")
        };

        _validator.ValidateAsync(command, Arg.Any<CancellationToken>())
            .Returns(new TestValidationResult(new ValidationResult(validationFailures)));

        // Act
        var result = await _behavior.Handle(command, _next, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("TestData is required");
        result.Error.Should().Contain("TestData must be at least 5 characters");

        await _next.DidNotReceive()();
    }

    [Fact]
    public async Task When_no_validators_should_call_next_handler_Async()
    {
        // Arrange
        var command = new TestCommand { TestData = "any data" };
        var expectedResult = Success("handled");
        var emptyValidatorProvider = CreateValidatorProvider();
        var behaviorWithoutValidators =
            new ValidationBehavior<TestCommand, Result<string>>(emptyValidatorProvider);

        _next().Returns(expectedResult);

        // Act
        var result = await behaviorWithoutValidators.Handle(command, _next, CancellationToken.None);

        // Assert
        result.Should().Be(expectedResult);
        await _next.Received(1)();
    }

    [Fact]
    public async Task When_multiple_validators_all_must_pass_Async()
    {
        // Arrange
        var command = new TestCommand { TestData = "test" };
        var validator1 = Substitute.For<IMessageValidator<TestCommand>>();
        var validator2 = Substitute.For<IMessageValidator<TestCommand>>();

        validator1.ValidateAsync(command, Arg.Any<CancellationToken>())
            .Returns(new TestValidationResult(new ValidationResult()));

        validator2.ValidateAsync(command, Arg.Any<CancellationToken>())
            .Returns(new TestValidationResult(new ValidationResult([new ValidationFailure("TestData", "Second validator failed")])));

        var multipleValidatorProvider = CreateValidatorProvider(validator1, validator2);
        var multipleBehavior = new ValidationBehavior<TestCommand, Result<string>>(multipleValidatorProvider);

        // Act
        var result = await multipleBehavior.Handle(command, _next, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Second validator failed");
        await _next.DidNotReceive()();
    }

    [Fact]
    public async Task When_cancellation_requested_should_propagate_cancellation_Async()
    {
        // Arrange
        var command = new TestCommand { TestData = "test" };
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        // Act & Assert
        await Assert.ThrowsAsync<OperationCanceledException>(() => _behavior.Handle(command, _next, cts.Token));
    }

    private static IValidatorProvider CreateValidatorProvider(params IMessageValidator<TestCommand>[] validators)
    {
        var validatorProvider = Substitute.For<IValidatorProvider>();
        validatorProvider.GetValidators<TestCommand>().Returns(validators);
        return validatorProvider;
    }
}
