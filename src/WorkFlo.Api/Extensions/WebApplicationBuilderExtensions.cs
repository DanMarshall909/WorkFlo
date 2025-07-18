using System.Diagnostics.CodeAnalysis;
using WorkFlo.Api.Configuration;
using WorkFlo.Api.Services;
using WorkFlo.Infrastructure.Configuration;
using FastEndpoints;
using Serilog;

namespace WorkFlo.Api.Extensions;

/// <summary>
/// Extension methods for WebApplicationBuilder configuration
/// </summary>
internal static class WebApplicationBuilderExtensions
{
    /// <summary>
    /// Configures all services for the Anchor API
    /// </summary>
    [SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "Extension method, builder is not null")]
    public static WebApplicationBuilder ConfigureAnchorServices(this WebApplicationBuilder builder)
    {
        // Use Serilog for logging
        builder.Host.UseSerilog();

        // Add CORS configuration
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowLocalhost", policy =>
            {
                policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });

        // Add database services with schema separation
        builder.Services.AddDatabaseServices(builder.Configuration);

        // Add CQRS and validation services
        builder.Services.AddMediatRServices();
        builder.Services.AddValidationServices();
        builder.Services.AddFastEndpointsServices();
        builder.Services.AddApplicationServices();

        // Add authentication services
        builder.Services.AddAuthenticationServices();
        builder.Services.AddJwtAuthentication(builder.Configuration);

        // Add version service
        builder.Services.AddSingleton<IVersionService, VersionService>();

        return builder;
    }

    /// <summary>
    /// Configures API documentation services (Swagger/OpenAPI)
    /// </summary>
    [SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "Extension method, builder is not null")]
    public static WebApplicationBuilder ConfigureApiDocumentation(this WebApplicationBuilder builder)
    {
        builder.Services.AddEndpointsApiExplorer();

        // Use only NSwag for OpenAPI/Swagger and TypeScript client generation
        builder.Services.AddOpenApiDocument(config =>
        {
            config.DocumentName = "anchor-api";
            config.Title = "Anchor API";
            config.Version = "v1";
            config.Description = "Privacy-first ADHD task management API with TypeScript client generation";
        });

        return builder;
    }

    /// <summary>
    /// Configures health check services
    /// </summary>
    [SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "Extension method, builder is not null")]
    public static WebApplicationBuilder ConfigureHealthChecks(this WebApplicationBuilder builder)
    {
        builder.Services.AddHealthChecks();
        return builder;
    }
}
