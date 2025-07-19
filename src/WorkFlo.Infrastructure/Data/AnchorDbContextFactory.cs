using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace WorkFlo.Infrastructure.Data;

/// <summary>
/// Design-time factory for creating WorkFloDbContext instances during migrations
/// Required for EF Core tooling to work properly
/// </summary>
public class WorkFloDbContextFactory : IDesignTimeDbContextFactory<WorkFloDbContext>
{
    public WorkFloDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<WorkFloDbContext>();

        // Use a default connection string for migrations
        // In production, this will be overridden by configuration
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=WorkFloDb;Username=workflo_app;Password=workflo_app_secure_password_2024!;Include Error Detail=true");

        return new(optionsBuilder.Options);
    }
}
