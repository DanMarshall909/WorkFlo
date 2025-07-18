using System.Diagnostics.CodeAnalysis;
using WorkFlo.Api.Extensions;
using Serilog;
using Serilog.Events;

namespace WorkFlo.Api;

[SuppressMessage("Design", "CA1052:Static holder types should be static",
    Justification = "Program class is entry point")]
[SuppressMessage("Major Code Smell", "S1118:Utility classes should not have public constructors",
    Justification = "Program class is entry point")]
[SuppressMessage("Style", "RCS1102:Make class static",
    Justification = "Program class is entry point")]
#pragma warning disable CA1052
#pragma warning disable CA1515
public class Program
#pragma warning restore CA1515
#pragma warning restore CA1052
{
    [SuppressMessage("Usage", "MA0004:Use Task.ConfigureAwait", Justification = "ASP.NET Core manages context")]
    [SuppressMessage("Usage", "CA2007:Consider calling ConfigureAwait", Justification = "ASP.NET Core manages context")]
    public static async Task Main(string[] args)
    {
        WebApplicationExtensions.ConfigureLogging();
        try
        {
            Log.Information("Starting Anchor API");

            WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

            // Configure all services
            builder.ConfigureAnchorServices()
                   .ConfigureApiDocumentation()
                   .ConfigureHealthChecks();

            WebApplication app = builder.Build();

            // Configure application pipeline
            await app.EnsureDatabaseReadyAsync(builder.Configuration);

            app.ConfigureDevelopmentPipeline()
               .ConfigureRequestPipeline()
               .ConfigureEndpoints();

            Log.Information("Anchor API started successfully");
            await app.RunAsync();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Anchor API failed to start");
            throw;
        }
        finally
        {
            await Log.CloseAndFlushAsync();
        }
    }
}
