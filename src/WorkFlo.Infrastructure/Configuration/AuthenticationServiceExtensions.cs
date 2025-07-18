using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Application.Services;
using WorkFlo.Infrastructure.Services;
using WorkFlo.Infrastructure.Services.Auth;
using Microsoft.Extensions.DependencyInjection;

namespace WorkFlo.Infrastructure.Configuration;

/// <summary>
/// Service extensions for authentication services
/// </summary>
public static class AuthenticationServiceExtensions
{
    /// <summary>
    /// Registers authentication services with the DI container
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddAuthenticationServices(this IServiceCollection services)
    {
        // Register authentication services
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHashingService, PasswordHashingService>();
        services.AddScoped<IEmailHashingService, EmailHashingService>();
        services.AddScoped<IPasswordBreachService, LocalPasswordBreachService>();
        services.AddScoped<IEmailVerificationTokenService, EmailVerificationTokenService>();
        services.AddScoped<IEmailService, EmailService>();

        // Register OAuth services with named HttpClients
        services.AddHttpClient<GoogleOAuthService>();
        services.AddHttpClient<MicrosoftOAuthService>();

        // Register OAuth services in collection for the handler
        services.AddScoped<IOAuthService, GoogleOAuthService>();
        services.AddScoped<IOAuthService, MicrosoftOAuthService>();

        // Register OAuth configurations (these would come from app settings in production)
        services.AddSingleton<GoogleOAuthConfig>(new GoogleOAuthConfig
        {
            ClientId = "google-client-id", // Configure from appsettings.json
            ClientSecret = "google-client-secret", // Configure from appsettings.json
            TokenEndpoint = "https://oauth2.googleapis.com/token",
            UserInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
        });
        services.AddSingleton<MicrosoftOAuthConfig>(new MicrosoftOAuthConfig
        {
            ClientId = "microsoft-client-id", // Configure from appsettings.json
            ClientSecret = "microsoft-client-secret", // Configure from appsettings.json
            TokenEndpoint = "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            UserInfoEndpoint = "https://graph.microsoft.com/v1.0/me",
            Scope = "openid profile email"
        });

        return services;
    }
}
