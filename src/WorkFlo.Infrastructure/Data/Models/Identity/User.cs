using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection;
using WorkFlo.Domain.Common.Errors;
using Mapster;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Infrastructure.Data.Models.Identity;

[Table("users", Schema = "workflo_identity")]
public class User : IMappableToDomain<WorkFlo.Domain.Users.User>
{
    [Key][Column("id")] public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("email_hash")]
    [MaxLength(64)]
    public string EmailHash { get; set; } = string.Empty;

    [Required]
    [Column("password_hash")]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("email_verified")] public bool EmailVerified { get; set; } = false;

    [Column("created_at")] public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Column("updated_at")] public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Column("last_login_at")] public DateTimeOffset? LastLoginAt { get; set; }

    [Column("is_active")] public bool IsActive { get; set; } = true;

    [Column("data_retention_until")] public DateTimeOffset? DataRetentionUntil { get; set; }

    // Navigation properties
    public UserPreferences? Preferences { get; set; }
    public Domain.Users.User ToDomain()
    {
        Domain.Common.TypeSafeResult<Domain.Users.User, ValidationError> result = Domain.Users.User.Create(EmailHash, PasswordHash);
        if (!result.IsSuccess)
        {
            throw new InvalidOperationException($"Failed to create domain user: {result.Error.Message}");
        }

        Domain.Users.User domainUser = result.Value;

        // Use reflection to set private properties since they don't have public setters
        PropertyInfo? idProperty = typeof(Domain.Users.User).GetProperty("Id");
        idProperty?.SetValue(domainUser, Id);

        PropertyInfo? emailVerifiedProperty = typeof(Domain.Users.User).GetProperty("EmailVerified");
        emailVerifiedProperty?.SetValue(domainUser, EmailVerified);

        PropertyInfo? isActiveProperty = typeof(Domain.Users.User).GetProperty("IsActive");
        isActiveProperty?.SetValue(domainUser, IsActive);

        PropertyInfo? createdAtProperty = typeof(Domain.Users.User).GetProperty("CreatedAt");
        createdAtProperty?.SetValue(domainUser, CreatedAt.DateTime);

        PropertyInfo? updatedAtProperty = typeof(Domain.Users.User).GetProperty("UpdatedAt");
        updatedAtProperty?.SetValue(domainUser, UpdatedAt.DateTime);

        return domainUser;
    }
}
