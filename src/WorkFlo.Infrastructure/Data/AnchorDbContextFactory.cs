using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace WorkFlo.Infrastructure.Data;

/// <summary>
/// Design-time factory for creating AnchorDbContext instances during migrations
/// Required for EF Core tooling to work properly
/// </summary>
public class AnchorDbContextFactory : IDesignTimeDbContextFactory<AnchorDbContext>
{
    public AnchorDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AnchorDbContext>();

        // Use a default connection string for migrations
        // In production, this will be overridden by configuration
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=AnchorDb;Username=anchor_app;Password=anchor_app_secure_password_2024!;Include Error Detail=true");

        return new(optionsBuilder.Options);
    }
}
