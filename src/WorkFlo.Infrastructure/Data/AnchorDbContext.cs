using WorkFlo.Infrastructure.Data.Models.Identity;
using Microsoft.EntityFrameworkCore;

namespace WorkFlo.Infrastructure.Data;

/// <summary>
/// Main Entity Framework DbContext for Anchor application
/// Minimal configuration matching actual model properties
/// </summary>
public class AnchorDbContext : DbContext
{
    public AnchorDbContext(DbContextOptions<AnchorDbContext> options) : base(options)
    {
    }

    // Core entities
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<UserPreferences> UserPreferences { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User - with schema configuration and indexes
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("users", "anchor_identity");

            // Performance indexes
            entity.HasIndex(e => e.EmailHash).HasDatabaseName("idx_users_email_hash");
            entity.HasIndex(e => e.CreatedAt).HasDatabaseName("idx_users_created_at");
            entity.HasIndex(e => e.IsActive).HasDatabaseName("idx_users_active");
        });

        // UserPreferences - with schema configuration
        modelBuilder.Entity<UserPreferences>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("user_preferences", "anchor_identity");
            entity.HasOne(up => up.User)
                .WithOne(u => u.Preferences)
                .HasForeignKey<UserPreferences>(up => up.UserId);
        });
    }
}
