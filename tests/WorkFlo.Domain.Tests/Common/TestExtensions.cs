using WorkFlo.Domain.Common;
using FluentAssertions;

namespace WorkFlo.Domain.Tests.Common;

/// <summary>
/// Extension methods to reduce test duplication and improve readability
/// </summary>
internal static class TestExtensions
{
    /// <summary>
    /// Asserts that a Result is successful with expected value
    /// </summary>
    public static T ShouldBeSuccessWithValue<T>(this Result<T> result, string because = "")
    {
        result.IsSuccess.Should().BeTrue(because);
        result.Error.Should().BeNull("because successful operations have no errors");
        result.Value.Should().NotBeNull("because valid creation should return an instance");
        return result.Value!;
    }

    /// <summary>
    /// Asserts that a Result is successful
    /// </summary>
    public static void ShouldBeSuccess(this Result result, string because = "")
    {
        result.IsSuccess.Should().BeTrue(because);
        result.Error.Should().BeNull("because successful operations have no errors");
    }

    /// <summary>
    /// Asserts that a Result failed with expected error message
    /// </summary>
    public static void ShouldBeFailureWithError<T>(this Result<T> result, string expectedError, string because = "")
    {
        result.IsSuccess.Should().BeFalse(because);
        result.Error.Should().Be(expectedError, "because error messages should match expected validation rules");
        result.Value.Should().BeNull("because failed operations return no value");
    }

    /// <summary>
    /// Asserts that a Result failed with error containing specific text
    /// </summary>
    public static void ShouldBeFailureContaining<T>(this Result<T> result, string errorText, string because = "")
    {
        result.IsSuccess.Should().BeFalse(because);
        result.Error.Should().Contain(errorText, "because error should indicate the validation issue");
        result.Value.Should().BeNull("because failed operations return no value");
    }

    /// <summary>
    /// Asserts that a DateTime is close to now with standard precision
    /// </summary>
    public static void ShouldBeCloseToNow(this DateTime dateTime, string because = "")
    {
        dateTime.Should().BeCloseTo(DateTime.UtcNow, TestConstants.TimeComparisonPrecision, because);
    }

    /// <summary>
    /// Asserts that a focus score is within valid range
    /// </summary>
    public static void ShouldBeValidFocusScore(this int focusScore, string because = "")
    {
        focusScore.Should().BeInRange(TestConstants.MinFocusScore, TestConstants.MaxFocusScore, because);
    }

    /// <summary>
    /// Asserts that a score is at minimum boundary
    /// </summary>
    public static void ShouldBeAtMinimum(this int score, int minimum, string because = "")
    {
        score.Should().Be(minimum, because);
    }

    /// <summary>
    /// Asserts that a score is at maximum boundary
    /// </summary>
    public static void ShouldBeAtMaximum(this int score, int maximum, string because = "")
    {
        score.Should().Be(maximum, because);
    }

    /// <summary>
    /// Asserts that a percentage is within valid range
    /// </summary>
    public static void ShouldBeValidPercentage(this double percentage, string because = "")
    {
        percentage.Should().BeInRange(0.0, 100.0, because);
    }

    /// <summary>
    /// Asserts that a duration is non-negative
    /// </summary>
    public static void ShouldBeNonNegative(this int duration, string because = "")
    {
        duration.Should().BeGreaterThanOrEqualTo(0, because);
    }

    /// <summary>
    /// Asserts that a TimeSpan is non-negative
    /// </summary>
    public static void ShouldBeNonNegative(this TimeSpan timeSpan, string because = "")
    {
        timeSpan.Should().BeGreaterThanOrEqualTo(TimeSpan.Zero, because);
    }
}
