using WorkFlo.Infrastructure.Services;
using FluentAssertions;

namespace WorkFlo.Infrastructure.Tests.Services;

public class LocalPasswordBreachServiceTests
{
    private readonly LocalPasswordBreachService _service = new();

    [Theory]
    [InlineData("password")]
    [InlineData("123456")]
    [InlineData("password123")]
    [InlineData("admin")]
    [InlineData("Password")] // Test case insensitivity
    [InlineData("PASSWORD")] // Test case insensitivity
    [InlineData("PaSsWoRd")] // Test case insensitivity
    public async Task Common_breached_passwords_are_detectedAsync(string password)
    {
        // Act
        var result = await _service.IsPasswordBreachedAsync(password);

        // Assert
        result.Should().BeTrue($"'{password}' is a known breached password");
    }

    [Theory]
    [InlineData("UniqueSecureP@ssw0rd!")]
    [InlineData("MyVeryLongAndComplexPassword123!@#")]
    [InlineData("NotInBreachList2024")]
    [InlineData("CustomUserPassword")]
    public async Task Non_breached_passwords_are_not_detectedAsync(string password)
    {
        // Act
        var result = await _service.IsPasswordBreachedAsync(password);

        // Assert
        result.Should().BeFalse($"'{password}' is not a known breached password");
    }

    [Fact]
    public Task Null_password_throws_argument_null_exceptionAsync()
    {
        // Act & Assert
        return FluentActions.Invoking(() => _service.IsPasswordBreachedAsync(null!))
            .Should().ThrowAsync<ArgumentNullException>()
            .WithParameterName("password");
    }

    [Fact]
    public async Task Empty_password_is_not_breachedAsync()
    {
        // Act
        var result = await _service.IsPasswordBreachedAsync(string.Empty);

        // Assert
        result.Should().BeFalse("empty password is not in breach list");
    }

    [Fact]
    public async Task Case_insensitive_detection_works_correctlyAsync()
    {
        // Arrange
        var variations = new[] { "password", "PASSWORD", "Password", "pAsSwOrD" };

        // Act & Assert
        foreach (var variation in variations)
        {
            var result = await _service.IsPasswordBreachedAsync(variation);
            result.Should().BeTrue($"'{variation}' matches 'password' case-insensitively");
        }
    }

    [Theory]
    [InlineData("password ")] // Trailing space
    [InlineData(" password")] // Leading space
    [InlineData("pass word")] // Space in middle
    public async Task Passwords_with_spaces_are_treated_as_differentAsync(string password)
    {
        // Act
        var result = await _service.IsPasswordBreachedAsync(password);

        // Assert
        result.Should().BeFalse($"'{password}' with spaces is different from 'password'");
    }

    [Fact]
    public async Task Service_is_thread_safeAsync()
    {
        // Arrange
        var tasks = new List<Task<bool>>();
        var passwords = new[] { "password", "123456", "uniquepass", "admin", "secure123" };

        // Act - Run multiple concurrent checks
        for (int i = 0; i < 100; i++)
        {
            var password = passwords[i % passwords.Length];
            tasks.Add(_service.IsPasswordBreachedAsync(password));
        }

        var results = await Task.WhenAll(tasks);

        // Assert - Verify consistent results
        results.Count(r => r).Should().Be(60); // 3 breached passwords * 20 iterations each
        results.Count(r => !r).Should().Be(40); // 2 non-breached passwords * 20 iterations each
    }
}
