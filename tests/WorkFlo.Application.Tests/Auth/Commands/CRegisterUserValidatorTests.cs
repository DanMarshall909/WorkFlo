using WorkFlo.Application.Auth.Commands;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace WorkFlo.Application.Tests.Auth.Commands;

public sealed class CRegisterUserValidatorTests
{
    private readonly CRegisterUserValidator _validator = new();

    [Fact]
    public void Should_pass_with_valid_registration_data()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = "password123",
            ConfirmPassword = "password123"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_fail_when_email_is_empty()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "",
            Password = "password123",
            ConfirmPassword = "password123"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Email is required");
    }

    [Fact]
    public void Should_fail_when_email_is_invalid()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "invalid-email",
            Password = "password123",
            ConfirmPassword = "password123"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Please provide a valid email address");
    }

    [Fact]
    public void Should_fail_when_email_exceeds_254_characters()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = new string('a', 500) + "@test.com", // 254+ characters
            Password = "password123",
            ConfirmPassword = "password123"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Email cannot exceed 254 characters");
    }

    [Fact]
    public void Should_fail_when_password_is_empty()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = "",
            ConfirmPassword = ""
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password is required");
    }

    [Fact]
    public void Should_fail_when_password_is_less_than_8_characters()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = "short",
            ConfirmPassword = "short"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must be at least 8 characters long");
    }

    [Fact]
    public void Should_pass_when_password_is_exactly_8_characters()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = "12345678",
            ConfirmPassword = "12345678"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_pass_with_simple_8_character_password()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = "password",
            ConfirmPassword = "password"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeTrue();
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Should_fail_when_confirm_password_is_empty()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = "password123",
            ConfirmPassword = ""
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.ConfirmPassword)
            .WithErrorMessage("Password confirmation is required");
    }

    [Fact]
    public void Should_fail_when_passwords_do_not_match()
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = "password123",
            ConfirmPassword = "different123"
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.ConfirmPassword)
            .WithErrorMessage("Passwords do not match");
    }

    [Theory]
    [InlineData("aaaaaaaa")] // All lowercase
    [InlineData("AAAAAAAA")] // All uppercase
    [InlineData("12345678")] // All numbers
    [InlineData("!!!!!!!!!")] // All special characters
    [InlineData("aA1!aA1!")] // Mixed characters
    [InlineData("simple123")] // Simple alphanumeric
    public void Should_pass_with_any_8_character_password_regardless_of_complexity(string password)
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = password,
            ConfirmPassword = password
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeTrue();
        result.ShouldNotHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Should_fail_when_password_exceeds_128_characters()
    {
        // Arrange
        var longPassword = new string('a', 129);
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = longPassword,
            ConfirmPassword = longPassword
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password cannot exceed 128 characters");
    }

    [Theory]
    [InlineData("🔒🔒🔒🔒🔒🔒🔒🔒")] // Unicode characters
    [InlineData("password\n")] // Contains newline
    [InlineData("pass\tword")] // Contains tab
    [InlineData("' OR 1=1 --")] // SQL injection pattern
    [InlineData("<script>alert('xss')</script>")] // XSS pattern
    public void Should_pass_with_edge_case_passwords_when_length_valid(string password)
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = password,
            ConfirmPassword = password
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeTrue();
        result.ShouldNotHaveValidationErrorFor(x => x.Password);
    }

    [Theory]
    [InlineData("        ")] // 8 spaces
    [InlineData("\t\t\t\t\t\t\t\t")] // 8 tabs
    [InlineData("   \t   \t")] // Mixed whitespace
    public void Should_fail_with_whitespace_only_passwords(string password)
    {
        // Arrange
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = password,
            ConfirmPassword = password
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password cannot be only whitespace");
    }

    [Fact]
    public void Should_pass_when_password_is_exactly_128_characters()
    {
        // Arrange
        var maxPassword = new string('a', 128);
        var command = new CRegisterUser
        {
            Email = "user@example.com",
            Password = maxPassword,
            ConfirmPassword = maxPassword
        };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
