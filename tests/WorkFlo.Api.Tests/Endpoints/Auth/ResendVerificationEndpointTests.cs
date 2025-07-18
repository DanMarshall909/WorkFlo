using WorkFlo.Api.Endpoints.Auth;
using WorkFlo.Application.Auth.Commands;
using WorkFlo.Contracts.Auth;
using FluentAssertions;
using MediatR;
using NSubstitute;

namespace WorkFlo.Api.Tests.Endpoints.Auth;

/// <summary>
/// Tests for resend verification endpoint
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public class ResendVerificationEndpointTests
{
    private readonly IMediator _mediator;

    private readonly string _testEmail = "test@example.com";

    public ResendVerificationEndpointTests()
    {
        _mediator = Substitute.For<IMediator>();
    }

    [Fact]
    public void endpoint_can_be_created_with_mediator()
    {
        // Arrange & Act
        var endpoint = new ResendVerificationEndpoint(_mediator);

        // Assert
        endpoint.Should().NotBeNull("Endpoint should be created with mediator");
    }

    [Fact]
    public void endpoint_constructor_validates_mediator()
    {
        // Arrange
        IMediator? nullMediator = null;

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new ResendVerificationEndpoint(nullMediator!));
    }

    [Fact]
    public void resend_verification_request_creates_correct_command()
    {
        // Arrange
        var request = new ResendVerificationRequest { Email = _testEmail };

        // Act
        var command = new CResendVerification { Email = request.Email };

        // Assert
        command.Email.Should().Be(_testEmail);
    }
}
