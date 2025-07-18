using WorkFlo.Domain.Common;
using WorkFlo.Domain.Common.Errors;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Domain.Users;

/// <summary>
/// User domain entity representing an authenticated user in the system
/// </summary>
public class User : AggregateRoot
{
    private User() { } // For EF Core

    private User(Guid id, string emailHash, string passwordHash)
    {
        Id = id;
        EmailHash = emailHash;
        PasswordHash = passwordHash;
        EmailVerified = false;
        IsActive = true;
        IsAnonymous = false;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string EmailHash { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public bool EmailVerified { get; private set; }
    public bool IsActive { get; private set; }
    public bool IsAnonymous { get; private set; }
    public string PreferredName { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public DateTime? DataExpiresAt { get; private set; }

    // Privacy-first properties for anonymous users
    public bool CanAccessCloudFeatures => !IsAnonymous;
    public bool CanExportData => true; // All users can export their data
    public bool HasDataRetentionLimits => IsAnonymous;

    public static TypeSafeResult<User, ValidationError> Create(string emailHash, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(emailHash))
        {
            return UserError.EmailHashRequired();
        }

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            return UserError.PasswordHashRequired();
        }

        var user = new User(Guid.NewGuid(), emailHash, passwordHash);
        return TypeSafeResult<User, ValidationError>.Success(user);
    }

    /// <summary>
    /// Creates an anonymous user for privacy-first usage
    /// </summary>
    public static User CreateAnonymous()
    {
        return new User
        {
            Id = Guid.NewGuid(),
            EmailHash = string.Empty,
            PasswordHash = string.Empty,
            EmailVerified = false,
            IsActive = true,
            IsAnonymous = true,
            PreferredName = "Guest",
            CreatedAt = DateTime.UtcNow,
            DataExpiresAt = DateTime.UtcNow.AddDays(30) // 30 days default retention
        };
    }

    public void VerifyEmail()
    {
        EmailVerified = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public TypeSafeResult<ValidationError> UpdatePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
        {
            return UserError.NewPasswordHashRequired();
        }

        PasswordHash = newPasswordHash;
        UpdatedAt = DateTime.UtcNow;
        return TypeSafeResult<ValidationError>.Success();
    }

    /// <summary>
    /// Converts an anonymous user to a registered user
    /// This preserves the user's data while upgrading their account
    /// </summary>
    public TypeSafeResult<User, DomainError> ConvertToRegistered(string emailHash, string preferredName)
    {
        if (!IsAnonymous)
        {
            return UserError.AlreadyRegistered();
        }

        if (string.IsNullOrWhiteSpace(emailHash))
        {
            return UserError.EmailHashRequired();
        }

        if (string.IsNullOrWhiteSpace(preferredName))
        {
            return UserError.PreferredNameRequired();
        }

        IsAnonymous = false;
        EmailHash = emailHash;
        PreferredName = preferredName;
        DataExpiresAt = null; // Remove expiration for registered users
        UpdatedAt = DateTime.UtcNow;

        return TypeSafeResult<User, DomainError>.Success(this);
    }
}
