using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace WorkFlo.Api.Configuration;

/// <summary>
/// Extensions for configuring JWT authentication
/// </summary>
internal static class JwtAuthenticationExtensions
{
    /// <summary>
    /// Adds JWT authentication configuration
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configuration">The application configuration</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services,
        IConfiguration configuration)
    {
        string jwtSecret = configuration["JWT:Secret"] ??
                           throw new InvalidOperationException("JWT:Secret is not configured");
        string jwtIssuer = configuration["JWT:Issuer"] ?? "WorkFlo";
        string jwtAudience = configuration["JWT:Audience"] ?? "WorkFlo";

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new()
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecret)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = jwtAudience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero // Remove default 5-minute tolerance
                };

                options.Events = new()
                {
                    OnAuthenticationFailed = context =>
                    {
                        if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                        {
                            context.Response.Headers.Append("Token-Expired", "true");
                        }

                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("RequireAuthenticatedUser", policy =>
            {
                policy.RequireAuthenticatedUser();
            });
        });

        return services;
    }
}
