namespace WorkFlo.Domain.Common.Errors;

/// <summary>
/// User-specific domain errors
/// </summary>
public static class UserError
{
    /// <summary>
    /// Email hash validation errors
    /// </summary>
    public static ValidationError.Required EmailHashRequired()
        => new("Email hash");

    /// <summary>
    /// Password hash validation errors
    /// </summary>
    public static ValidationError.Required PasswordHashRequired()
        => new("Password hash");

    /// <summary>
    /// Preferred name validation errors
    /// </summary>
    public static ValidationError.Required PreferredNameRequired()
        => new("Preferred name");

    /// <summary>
    /// User already registered business rule error
    /// </summary>
    public static BusinessRuleError.InvalidUserState AlreadyRegistered()
        => new("anonymous", "registered");

    /// <summary>
    /// Password update validation errors
    /// </summary>
    public static ValidationError.Required NewPasswordHashRequired()
        => new("New password hash");
}
