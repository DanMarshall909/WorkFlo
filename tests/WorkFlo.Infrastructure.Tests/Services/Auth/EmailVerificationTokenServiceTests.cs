using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WorkFlo.Infrastructure.Services.Auth;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NSubstitute;

namespace WorkFlo.Infrastructure.Tests.Services.Auth;

/// <summary>
/// Tests for email verification token service
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public class EmailVerificationTokenServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly EmailVerificationTokenService _tokenService;
    private readonly Guid _testUserId = Guid.NewGuid();
    private readonly string _testJwtSecret = "this-is-a-test-secret-key-that-is-at-least-32-characters-long";

    public EmailVerificationTokenServiceTests()
    {
        var configValues = new Dictionary<string, string?>
(StringComparer.Ordinal)
        {
            ["JWT:Secret"] = _testJwtSecret,
            ["JWT:Issuer"] = "TestIssuer",
            ["JWT:Audience"] = "TestAudience",
            ["EmailVerification:TokenExpiryHours"] = "24"
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        _tokenService = new EmailVerificationTokenService(_configuration);
    }

    [Fact]
    public async Task token_service_generates_valid_tokenAsync()
    {
        // Act
        string token = await _tokenService.GenerateTokenAsync(_testUserId, CancellationToken.None);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3); // JWT format: header.payload.signature
    }

    [Fact]
    public async Task generated_token_can_be_validated_successfullyAsync()
    {
        // Arrange
        string token = await _tokenService.GenerateTokenAsync(_testUserId, CancellationToken.None);

        // Act
        var result = await _tokenService.ValidateTokenAsync(token, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(_testUserId);
    }

    [Fact]
    public async Task invalid_token_returns_errorAsync()
    {
        // Act
        var result = await _tokenService.ValidateTokenAsync("invalid.token.here", CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Invalid token");
    }

    [Fact]
    public async Task empty_token_returns_errorAsync()
    {
        // Act
        var result = await _tokenService.ValidateTokenAsync("", CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Token is required");
    }

    [Fact]
    public async Task null_token_returns_errorAsync()
    {
        // Act
        var result = await _tokenService.ValidateTokenAsync(null!, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Token is required");
    }

    [Fact]
    public async Task token_with_different_purpose_is_rejectedAsync()
    {
        // Arrange - Create a token with different purpose using raw JWT
        var jwtTokenService = new JwtTokenService(_configuration);
        string accessToken = await jwtTokenService.GenerateAccessTokenAsync(_testUserId, "test@email.com");

        // Act
        var result = await _tokenService.ValidateTokenAsync(accessToken, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid token purpose");
    }

    [Fact]
    public async Task token_with_different_secret_is_rejectedAsync()
    {
        // Arrange - Create service with different secret
        var differentConfigValues = new Dictionary<string, string?>
(StringComparer.Ordinal)
        {
            ["JWT:Secret"] = "different-secret-key-that-is-at-least-32-characters-long",
            ["JWT:Issuer"] = "TestIssuer",
            ["JWT:Audience"] = "TestAudience",
            ["EmailVerification:TokenExpiryHours"] = "24"
        };

        var differentConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(differentConfigValues)
            .Build();

        var differentTokenService = new EmailVerificationTokenService(differentConfig);
        string tokenWithDifferentSecret = await differentTokenService.GenerateTokenAsync(_testUserId, CancellationToken.None);

        // Act
        var result = await _tokenService.ValidateTokenAsync(tokenWithDifferentSecret, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid token signature");
    }

    [Fact]
    public async Task expired_token_is_rejectedAsync()
    {
        // Arrange - Create service with very short expiry
        var shortExpiryConfigValues = new Dictionary<string, string?>
(StringComparer.Ordinal)
        {
            ["JWT:Secret"] = _testJwtSecret,
            ["JWT:Issuer"] = "TestIssuer",
            ["JWT:Audience"] = "TestAudience",
            ["EmailVerification:TokenExpiryHours"] = "1" // 1 hour expiry
        };

        var shortExpiryConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(shortExpiryConfigValues)
            .Build();

        // Create a token service that generates expired tokens by manually setting expiry
        var tokenService = new EmailVerificationTokenService(shortExpiryConfig);

        // Use reflection to create an expired token for testing
        var expiredToken = await CreateExpiredTokenAsync(_testUserId);

        // Act
        var result = await _tokenService.ValidateTokenAsync(expiredToken, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Token has expired");
    }

    [Fact]
    public void service_requires_jwt_secret_configuration()
    {
        // Arrange
        var emptyConfigValues = new Dictionary<string, string?>
(StringComparer.Ordinal)
        {
            ["JWT:Issuer"] = "TestIssuer",
            ["JWT:Audience"] = "TestAudience",
            ["EmailVerification:TokenExpiryHours"] = "24"
        };

        var emptyConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(emptyConfigValues)
            .Build();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => new EmailVerificationTokenService(emptyConfig));
    }

    [Fact]
    public void service_uses_default_values_for_optional_configuration()
    {
        // Arrange
        var minimalConfigValues = new Dictionary<string, string?>
(StringComparer.Ordinal)
        {
            ["JWT:Secret"] = _testJwtSecret,
            ["EmailVerification:TokenExpiryHours"] = "24"
        };

        var minimalConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(minimalConfigValues)
            .Build();

        // Act & Assert
        var service = new EmailVerificationTokenService(minimalConfig);
        service.Should().NotBeNull();
    }

    [Fact]
    public async Task token_contains_correct_claimsAsync()
    {
        // Arrange
        string token = await _tokenService.GenerateTokenAsync(_testUserId, CancellationToken.None);

        // Act
        var result = await _tokenService.ValidateTokenAsync(token, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(_testUserId);
    }

    private Task<string> CreateExpiredTokenAsync(Guid userId)
    {
        // Create a token that's already expired by manually creating JWT with past expiry
        var tokenHandler = new JwtSecurityTokenHandler();
        byte[] key = Encoding.ASCII.GetBytes(_testJwtSecret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim("purpose", "email_verification"),
                new Claim("jti", Guid.NewGuid().ToString())
            ]),
            Expires = DateTime.UtcNow.AddMinutes(-1), // Already expired
            IssuedAt = DateTime.UtcNow.AddMinutes(-2), // Issued 2 minutes ago
            NotBefore = DateTime.UtcNow.AddMinutes(-2), // Valid from 2 minutes ago
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
        return Task.FromResult(tokenHandler.WriteToken(token));
    }
}
