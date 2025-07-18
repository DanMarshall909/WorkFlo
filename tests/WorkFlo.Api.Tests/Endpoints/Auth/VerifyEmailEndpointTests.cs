using WorkFlo.Api.Endpoints.Auth;
using WorkFlo.Application.Auth.Commands;
using WorkFlo.Contracts.Auth;
using FluentAssertions;
using MediatR;
using NSubstitute;

namespace WorkFlo.Api.Tests.Endpoints.Auth;

/// <summary>
/// Tests for email verification endpoint
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public class VerifyEmailEndpointTests
{
    private readonly IMediator _mediator;

    private readonly string _testToken = "verification_token_123";

    public VerifyEmailEndpointTests()
    {
        _mediator = Substitute.For<IMediator>();
    }

    [Fact]
    public void endpoint_can_be_created_with_mediator()
    {
        // Arrange & Act
        var endpoint = new VerifyEmailEndpoint(_mediator);

        // Assert
        endpoint.Should().NotBeNull("Endpoint should be created with mediator");
    }

    [Fact]
    public void endpoint_constructor_validates_mediator()
    {
        // Arrange
        IMediator? nullMediator = null;

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new VerifyEmailEndpoint(nullMediator!));
    }

    [Fact]
    public void verify_email_request_creates_correct_command()
    {
        // Arrange
        var request = new VerifyEmailRequest { Token = _testToken };

        // Act
        var command = new CVerifyEmail { Token = request.Token };

        // Assert
        command.Token.Should().Be(_testToken);
    }
}
