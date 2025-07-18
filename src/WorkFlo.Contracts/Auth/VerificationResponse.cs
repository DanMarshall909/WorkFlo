namespace WorkFlo.Contracts.Auth;

/// <summary>
/// Response for email verification operations
/// </summary>
public class VerificationResponse
{
    /// <summary>
    /// Success message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Indicates if the operation was successful
    /// </summary>
    public bool Success { get; set; }
}
