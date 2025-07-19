using System.Diagnostics.CodeAnalysis;
using WorkFlo.Api.Services;
using WorkFlo.Infrastructure.Configuration;
using FastEndpoints;
using Serilog;
using Serilog.Events;
using System.Net;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;

namespace WorkFlo.Api.Extensions;

/// <summary>
/// Extension methods for WebApplication pipeline configuration
/// </summary>
internal static class WebApplicationExtensions
{
    /// <summary>
    /// Ensures database is ready for use (skip for in-memory mode)
    /// </summary>
    [SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "Extension method, app is not null")]
    [SuppressMessage("Usage", "MA0004:Use Task.ConfigureAwait", Justification = "ASP.NET Core manages context")]
    [SuppressMessage("Usage", "CA2007:Consider calling ConfigureAwait", Justification = "ASP.NET Core manages context")]
    public static async Task<WebApplication> EnsureDatabaseReadyAsync(this WebApplication app, IConfiguration configuration)
    {
        if (!configuration.GetValue<bool>("Database:UseInMemory"))
        {
            await app.Services.EnsureDatabaseAsync().ConfigureAwait(false);
        }
        return app;
    }

    /// <summary>
    /// Configures the HTTP request pipeline for development environment
    /// </summary>
    [SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "Extension method, app is not null")]
    public static WebApplication ConfigureDevelopmentPipeline(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            // Use only NSwag for OpenAPI/Swagger
            app.UseOpenApi();
            app.UseSwaggerUi(config =>
            {
                config.DocumentTitle = "WorkFlo API";
                config.Path = "/swagger-ui";
                config.DocumentPath = "/swagger/{documentName}/swagger.json";
            });
        }
        return app;
    }

    /// <summary>
    /// Configures the core HTTP request pipeline
    /// </summary>
    [SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "Extension method, app is not null")]
    public static WebApplication ConfigureRequestPipeline(this WebApplication app)
    {
        app.UseHttpsRedirection();

        // Add global exception handling
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/json";

                var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
                var exception = exceptionHandlerPathFeature?.Error;

                var errorResponse = new
                {
                    Message = "An unexpected error occurred.",
                    Detailed = exception?.Message // Only include detailed message in development
                };

                await context.Response.WriteAsJsonAsync(errorResponse).ConfigureAwait(false);
            });
        });

        // Add CORS middleware
        app.UseCors("AllowLocalhost");

        // Add authentication and authorization middleware
        // Skip authentication in test environment to avoid 403 issues with FastEndpoints
        if (!app.Environment.IsEnvironment("Testing"))
        {
            app.UseAuthentication();
            app.UseAuthorization();
        }

        // Add FastEndpoints middleware
        app.UseFastEndpoints();

        return app;
    }

    /// <summary>
    /// Configures application endpoints
    /// </summary>
    [SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "Extension method, app is not null")]
    public static WebApplication ConfigureEndpoints(this WebApplication app)
    {
        // Map health check endpoint
        app.MapHealthChecks("/health");

        // Root endpoint with dynamic version
#pragma warning disable IL3050 // Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.
#pragma warning disable IL2026 // Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code
        app.MapGet("/", (IVersionService versionService) =>
            {
                VersionInfo version = versionService.GetVersionInfo();
                return Results.Ok(new
                {
                    message = "WorkFlo API is running",
                    version = version.Version,
                    build = version.BuildDate,
                    commit = version.GitCommit,
                    environment = version.Environment
                });
            })
            .WithName("GetRoot")
            .WithOpenApi()
            .Produces(200);
#pragma warning restore IL2026 // Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code
#pragma warning restore IL3050 // Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.

        return app;
    }

    public static void ConfigureLogging()
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("System", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.AspNetCore.Authentication", LogEventLevel.Information)
            .Enrich.FromLogContext()
            .Enrich.WithEnvironmentName()
            .Enrich.WithProcessId()
            .Enrich.WithThreadId()
            .Enrich.WithProperty("Application", "WorkFlo.Api")
            .WriteTo.Console()
            .WriteTo.Seq(Environment.GetEnvironmentVariable("SEQ_SERVER_URL") ?? "http://localhost:5341")
            .CreateLogger();
    }
}
