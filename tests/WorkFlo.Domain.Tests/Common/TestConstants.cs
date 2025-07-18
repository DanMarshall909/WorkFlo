using System;

namespace WorkFlo.Domain.Tests.Common;

/// <summary>
/// Constants used in domain tests for consistent testing behavior
/// </summary>
internal static class TestConstants
{
    /// <summary>
    /// Precision for DateTime comparison tests
    /// </summary>
    public static readonly TimeSpan TimeComparisonPrecision = TimeSpan.FromMilliseconds(100);

    /// <summary>
    /// Minimum valid focus score
    /// </summary>
    public const int MinFocusScore = 0;

    /// <summary>
    /// Maximum valid focus score
    /// </summary>
    public const int MaxFocusScore = 100;
}
