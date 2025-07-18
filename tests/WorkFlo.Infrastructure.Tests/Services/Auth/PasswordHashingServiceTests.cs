using System.Diagnostics;
using WorkFlo.Infrastructure.Services.Auth;
using Xunit;

namespace WorkFlo.Infrastructure.Tests.Services.Auth;

/// <summary>
/// Security-focused tests for password hashing service
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// </summary>
public class PasswordHashingServiceTests
{
    private readonly PasswordHashingService _passwordHashingService;
    private const string TestPassword = "TestPassword123!";
    private const string TestPassword2 = "DifferentPassword456@";

    public PasswordHashingServiceTests()
    {
        _passwordHashingService = new PasswordHashingService();
    }

    [Fact]
    public void valid_password_can_be_hashed()
    {
        // RED: Test basic password hashing functionality

        // Act
        var hashedPassword = _passwordHashingService.HashPassword(TestPassword);

        // Assert
        Assert.NotNull(hashedPassword);
        Assert.NotEmpty(hashedPassword);
        Assert.NotEqual(TestPassword, hashedPassword); // Should not be plaintext
        Assert.True(hashedPassword.Length > 50); // BCrypt hashes are long
        Assert.StartsWith("$2", hashedPassword, StringComparison.Ordinal); // BCrypt format starts with $2
    }

    [Fact]
    public void same_password_produces_different_hashes()
    {
        // RED: Test that salt is working properly (security requirement)

        // Act
        var hash1 = _passwordHashingService.HashPassword(TestPassword);
        var hash2 = _passwordHashingService.HashPassword(TestPassword);

        // Assert
        Assert.NotEqual(hash1, hash2); // Different salts should produce different hashes
        Assert.True(_passwordHashingService.VerifyPassword(TestPassword, hash1));
        Assert.True(_passwordHashingService.VerifyPassword(TestPassword, hash2));
    }

    [Fact]
    public void correct_password_verifies_successfully()
    {
        // RED: Test password verification works

        // Arrange
        var hashedPassword = _passwordHashingService.HashPassword(TestPassword);

        // Act
        var isValid = _passwordHashingService.VerifyPassword(TestPassword, hashedPassword);

        // Assert
        Assert.True(isValid);
    }

    [Fact]
    public void incorrect_password_fails_verification()
    {
        // RED: Test security - wrong passwords should fail

        // Arrange
        var hashedPassword = _passwordHashingService.HashPassword(TestPassword);

        // Act
        var isValid = _passwordHashingService.VerifyPassword(TestPassword2, hashedPassword);

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public void empty_password_throws_exception()
    {
        // RED: Test input validation

        // Act & Assert
        Assert.Throws<ArgumentException>(() => _passwordHashingService.HashPassword(string.Empty));
        Assert.Throws<ArgumentException>(() => _passwordHashingService.HashPassword(""));
    }

    [Fact]
    public void null_password_throws_exception()
    {
        // RED: Test null input validation

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => _passwordHashingService.HashPassword(null!));
    }

    [Fact]
    public void verification_with_empty_password_throws_exception()
    {
        // RED: Test verification input validation

        // Arrange
        var hashedPassword = _passwordHashingService.HashPassword(TestPassword);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => _passwordHashingService.VerifyPassword(string.Empty, hashedPassword));
        Assert.Throws<ArgumentException>(() => _passwordHashingService.VerifyPassword("", hashedPassword));
    }

    [Fact]
    public void verification_with_null_password_throws_exception()
    {
        // RED: Test verification null input validation

        // Arrange
        var hashedPassword = _passwordHashingService.HashPassword(TestPassword);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => _passwordHashingService.VerifyPassword(null!, hashedPassword));
    }

    [Fact]
    public void verification_with_empty_hash_throws_exception()
    {
        // RED: Test hash input validation

        // Act & Assert
        Assert.Throws<ArgumentException>(() => _passwordHashingService.VerifyPassword(TestPassword, string.Empty));
        Assert.Throws<ArgumentException>(() => _passwordHashingService.VerifyPassword(TestPassword, ""));
    }

    [Fact]
    public void verification_with_null_hash_throws_exception()
    {
        // RED: Test hash null input validation

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => _passwordHashingService.VerifyPassword(TestPassword, null!));
    }

    [Fact]
    public void verification_with_invalid_hash_returns_false()
    {
        // RED: Test security - invalid hashes should not crash but return false

        // Act
        var isValid = _passwordHashingService.VerifyPassword(TestPassword, "invalid-hash-format");

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public void verification_with_malformed_bcrypt_hash_returns_false()
    {
        // RED: Test security - malformed BCrypt hashes should be rejected

        // Act
        var isValid = _passwordHashingService.VerifyPassword(TestPassword, "$2a$10$malformed");

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public void password_hashing_is_slow_enough_for_security()
    {
        // RED: Test timing attack resistance - BCrypt should be slow

        // Arrange
        var stopwatch = Stopwatch.StartNew();

        // Act
        var hashedPassword = _passwordHashingService.HashPassword(TestPassword);
        stopwatch.Stop();

        // Assert
        Assert.True(stopwatch.ElapsedMilliseconds > 50); // Should take at least 50ms with work factor 12
        Assert.NotNull(hashedPassword);
    }

    [Fact]
    public void password_verification_is_slow_enough_for_security()
    {
        // RED: Test timing attack resistance - verification should also be slow

        // Arrange
        var hashedPassword = _passwordHashingService.HashPassword(TestPassword);
        var stopwatch = Stopwatch.StartNew();

        // Act
        var isValid = _passwordHashingService.VerifyPassword(TestPassword, hashedPassword);
        stopwatch.Stop();

        // Assert
        Assert.True(stopwatch.ElapsedMilliseconds > 50); // Should take at least 50ms with work factor 12
        Assert.True(isValid);
    }

    [Fact]
    public void hash_contains_proper_bcrypt_work_factor()
    {
        // RED: Test that the work factor is properly configured

        // Act
        var hashedPassword = _passwordHashingService.HashPassword(TestPassword);

        // Assert
        Assert.Contains("$12$", hashedPassword, StringComparison.Ordinal); // Should contain work factor 12
    }

    [Theory]
    [InlineData("a")]
    [InlineData("password")]
    [InlineData("verylongpasswordthatexceedsnormallimits")]
    [InlineData("P@ssw0rd123!@#$%^&*()")]
    [InlineData("🔒🔐🗝️")]
    public void various_password_formats_can_be_hashed_and_verified(string password)
    {
        // RED: Test edge cases with different password formats

        // Act
        var hashedPassword = _passwordHashingService.HashPassword(password);
        var isValid = _passwordHashingService.VerifyPassword(password, hashedPassword);

        // Assert
        Assert.True(isValid);
        Assert.NotEqual(password, hashedPassword);
    }

    [Fact]
    public void timing_attack_resistance_same_user_different_passwords()
    {
        // RED: Test that verification time is consistent to prevent timing attacks

        // Arrange
        var hashedPassword = _passwordHashingService.HashPassword(TestPassword);
        const int iterations = 10;
        var correctTimes = new List<long>();
        var incorrectTimes = new List<long>();

        // Act - Test correct password timing
        for (int i = 0; i < iterations; i++)
        {
            var stopwatch = Stopwatch.StartNew();
            _passwordHashingService.VerifyPassword(TestPassword, hashedPassword);
            stopwatch.Stop();
            correctTimes.Add(stopwatch.ElapsedMilliseconds);
        }

        // Act - Test incorrect password timing
        for (int i = 0; i < iterations; i++)
        {
            var stopwatch = Stopwatch.StartNew();
            _passwordHashingService.VerifyPassword(TestPassword2, hashedPassword);
            stopwatch.Stop();
            incorrectTimes.Add(stopwatch.ElapsedMilliseconds);
        }

        // Assert - Times should be similar (within reasonable variance)
        var correctAverage = correctTimes.Average();
        var incorrectAverage = incorrectTimes.Average();
        var timeDifference = Math.Abs(correctAverage - incorrectAverage);

        // Allow up to 50ms variance (timing attacks need much smaller differences)
        Assert.True(timeDifference < 50, $"Timing difference too large: {timeDifference}ms");
    }
}
