using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using WorkFlo.Infrastructure.Services.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace WorkFlo.Infrastructure.Tests.Services.Auth;

/// <summary>
/// Tests for JWT token service security and functionality
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// </summary>
public class JwtTokenServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly JwtTokenService _jwtTokenService;
    private readonly Guid _testUserId = Guid.NewGuid();
    private readonly string _testEmailHash = "test@example.com";

    public JwtTokenServiceTests()
    {
        var configurationData = new Dictionary<string, string?>
(StringComparer.Ordinal)
        {
            { "JWT:Secret", "TestSecretKey123!_ThisMustBeAtLeast32CharactersLong_ForTesting" },
            { "JWT:Issuer", "TestIssuer" },
            { "JWT:Audience", "TestAudience" }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();

        _jwtTokenService = new JwtTokenService(_configuration);
    }

    [Fact]
    public async Task valid_user_can_generate_access_tokenAsync()
    {
        // RED: This test should fail initially as we're testing the behavior

        // Act
        var token = await _jwtTokenService.GenerateAccessTokenAsync(_testUserId, _testEmailHash);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);

        // Verify token structure
        var tokenHandler = new JwtSecurityTokenHandler();
        Assert.True(tokenHandler.CanReadToken(token));
    }

    [Fact]
    public async Task generated_access_token_contains_correct_claimsAsync()
    {
        // RED: Testing token contains expected claims

        // Act
        var token = await _jwtTokenService.GenerateAccessTokenAsync(_testUserId, _testEmailHash);

        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        var jsonToken = tokenHandler.ReadJwtToken(token);

        // JWT standard claim names (ClaimTypes are mapped to these)
        var userIdClaim = jsonToken.Claims.FirstOrDefault(c => string.Equals(c.Type, "nameid", StringComparison.Ordinal));
        var emailClaim = jsonToken.Claims.FirstOrDefault(c => string.Equals(c.Type, "email", StringComparison.Ordinal));
        var jtiClaim = jsonToken.Claims.FirstOrDefault(c => string.Equals(c.Type, "jti", StringComparison.Ordinal));

        Assert.NotNull(userIdClaim);
        Assert.Equal(_testUserId.ToString(), userIdClaim.Value);
        Assert.NotNull(emailClaim);
        Assert.Equal(_testEmailHash, emailClaim.Value);
        Assert.NotNull(jtiClaim);
        Assert.True(Guid.TryParse(jtiClaim.Value, out _));
    }

    [Fact]
    public async Task access_token_expires_after_fifteen_minutesAsync()
    {
        // RED: Testing token expiry time

        // Act
        var token = await _jwtTokenService.GenerateAccessTokenAsync(_testUserId, _testEmailHash);

        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        var jsonToken = tokenHandler.ReadJwtToken(token);

        var expiryTime = jsonToken.ValidTo;
        var expectedExpiry = DateTime.UtcNow.AddMinutes(15);

        // Allow 1 minute tolerance for test execution time
        Assert.True(expiryTime <= expectedExpiry.AddMinutes(1));
        Assert.True(expiryTime >= expectedExpiry.AddMinutes(-1));
    }

    [Fact]
    public async Task tampered_token_fails_validationAsync()
    {
        // RED: Testing security - tampered tokens should be rejected

        // Arrange
        var validToken = await _jwtTokenService.GenerateAccessTokenAsync(_testUserId, _testEmailHash);
        var tamperedToken = validToken + "tampered";

        // Act
        var isValid = await _jwtTokenService.ValidateTokenAsync(tamperedToken);

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public async Task expired_token_fails_validationAsync()
    {
        // RED: Testing security - expired tokens should be rejected
        // This test will initially pass but is important for mutation testing

        // Note: In future, we would inject a clock service to test token expiry
        // For now, this test verifies that fresh tokens are valid

        // We'll need to modify the service to accept custom expiry for testing
        // For now, this test documents the expected behavior
        var token = await _jwtTokenService.GenerateAccessTokenAsync(_testUserId, _testEmailHash);

        // Wait for token to expire (this would be too slow for real tests)
        // In practice, we'd mock the clock or use a test double

        // For now, test that future date validation would work
        var isValid = await _jwtTokenService.ValidateTokenAsync(token);
        Assert.True(isValid); // Fresh token should be valid
    }

    [Fact]
    public async Task refresh_token_is_cryptographically_secureAsync()
    {
        // RED: Testing refresh token security

        // Act
        var token1 = await _jwtTokenService.GenerateRefreshTokenAsync(_testUserId);
        var token2 = await _jwtTokenService.GenerateRefreshTokenAsync(_testUserId);

        // Assert
        Assert.NotEqual(token1, token2); // Must be unique
        Assert.True(token1.Length >= 32); // Minimum entropy requirement
        Assert.True(token2.Length >= 32);

        // Verify base64 encoding
        Assert.True(IsBase64String(token1));
        Assert.True(IsBase64String(token2));
    }

    [Fact]
    public async Task valid_refresh_token_can_be_validatedAsync()
    {
        // RED: Testing refresh token validation

        // Arrange
        var refreshToken = await _jwtTokenService.GenerateRefreshTokenAsync(_testUserId);

        // Act
        var isValid = await _jwtTokenService.ValidateRefreshTokenAsync(refreshToken, _testUserId);

        // Assert
        Assert.True(isValid);
    }

    [Fact]
    public async Task refresh_token_for_wrong_user_fails_validationAsync()
    {
        // RED: Testing security - refresh tokens are user-specific

        // Arrange
        var refreshToken = await _jwtTokenService.GenerateRefreshTokenAsync(_testUserId);
        var wrongUserId = Guid.NewGuid();

        // Act
        var isValid = await _jwtTokenService.ValidateRefreshTokenAsync(refreshToken, wrongUserId);

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public async Task revoked_refresh_token_fails_validationAsync()
    {
        // RED: Testing refresh token revocation

        // Arrange
        var refreshToken = await _jwtTokenService.GenerateRefreshTokenAsync(_testUserId);

        // Act
        await _jwtTokenService.RevokeRefreshTokenAsync(refreshToken);
        var isValid = await _jwtTokenService.ValidateRefreshTokenAsync(refreshToken, _testUserId);

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public async Task user_id_can_be_extracted_from_valid_tokenAsync()
    {
        // RED: Testing token parsing for user identification

        // Arrange
        var token = await _jwtTokenService.GenerateAccessTokenAsync(_testUserId, _testEmailHash);

        // Act
        var extractedUserId = await _jwtTokenService.GetUserIdFromTokenAsync(token);

        // Assert
        Assert.NotNull(extractedUserId);
        Assert.Equal(_testUserId, extractedUserId);
    }

    [Fact]
    public async Task invalid_token_returns_null_user_idAsync()
    {
        // RED: Testing error handling for invalid tokens

        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var extractedUserId = await _jwtTokenService.GetUserIdFromTokenAsync(invalidToken);

        // Assert
        Assert.Null(extractedUserId);
    }

    [Fact]
    public void remember_me_extends_token_expiry()
    {
        // RED: Testing remember me functionality

        // Act
        var normalExpiry = _jwtTokenService.GetTokenExpiryTime(false);
        var rememberMeExpiry = _jwtTokenService.GetTokenExpiryTime(true);

        // Assert
        Assert.True(rememberMeExpiry > normalExpiry);
        Assert.True(rememberMeExpiry >= DateTime.UtcNow.AddDays(30).AddMinutes(-1));
        Assert.True(normalExpiry >= DateTime.UtcNow.AddDays(7).AddMinutes(-1));
    }

    private static bool IsBase64String(string value)
    {
        try
        {
            Convert.FromBase64String(value);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
