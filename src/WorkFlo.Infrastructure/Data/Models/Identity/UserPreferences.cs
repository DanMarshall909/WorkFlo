using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WorkFlo.Infrastructure.Data.Models.Identity;

[Table("user_preferences", Schema = "workflo_identity")]
public class UserPreferences
{
    [Key][Column("id")] public Guid Id { get; set; } = Guid.NewGuid();

    [Required][Column("user_id")] public Guid UserId { get; set; }

    // ADHD-specific preferences
    [Column("default_session_duration")] public int DefaultSessionDuration { get; set; } = 25;

    [Column("break_reminder_interval")] public int BreakReminderInterval { get; set; } = 5;

    [Column("nudge_intensity_level")] public int NudgeIntensityLevel { get; set; } = 2;

    // Notification preferences
    [Column("enable_desktop_notifications")]
    public bool EnableDesktopNotifications { get; set; } = true;

    [Column("enable_mobile_notifications")]
    public bool EnableMobileNotifications { get; set; } = true;

    [Column("enable_email_notifications")] public bool EnableEmailNotifications { get; set; } = false;

    // Focus preferences
    [Column("enable_hyperfocus_protection")]
    public bool EnableHyperfocusProtection { get; set; } = true;

    [Column("maximum_hyperfocus_duration")]
    public int MaximumHyperfocusDuration { get; set; } = 120;

    // Privacy preferences
    [Column("enable_analytics")] public bool EnableAnalytics { get; set; } = true;

    [Column("enable_ai_assistance")] public bool EnableAiAssistance { get; set; } = true;

    // Theme and UI
    [Column("theme_preference")]
    [MaxLength(20)]
    public string ThemePreference { get; set; } = "auto";

    [Column("ui_density")][MaxLength(20)] public string UiDensity { get; set; } = "comfortable";

    [Column("created_at")] public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Column("updated_at")] public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation property
    public User User { get; set; } = null!;
}
