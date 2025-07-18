using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using WorkFlo.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace WorkFlo.Infrastructure.Tests.Services;

public class EmailServiceTests
{
    private readonly ILogger<EmailService> _logger;
    private readonly EmailService _emailService;

    public EmailServiceTests()
    {
        _logger = Substitute.For<ILogger<EmailService>>();
        _emailService = new EmailService(_logger);
    }

    [Fact]
    public async Task SendVerificationEmailAsync_ValidEmail_EmailSentSuccessfullyAsync()
    {
        // Arrange
        var email = "test@example.com";
        var token = "verification-token-123";
        var userName = "Test User";

        // Act
        var result = await _emailService.SendVerificationEmailAsync(email, token, userName);

        // Assert
        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task SendVerificationEmailAsync_InvalidEmail_ReturnsFailureAsync()
    {
        // Arrange
        var invalidEmail = "invalid-email";
        var token = "verification-token-123";
        var userName = "Test User";

        // Act
        var result = await _emailService.SendVerificationEmailAsync(invalidEmail, token, userName);

        // Assert
        Assert.True(result.IsFailure());
        Assert.Contains("Invalid email format", result.Error, StringComparison.Ordinal);
    }
}
