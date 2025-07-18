using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Domain.Common;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// JWT-based email verification token service
/// Generates and validates tokens for email verification flow
/// </summary>
public class EmailVerificationTokenService : IEmailVerificationTokenService
{
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly int _tokenExpiryHours;
    private const string TokenPurpose = "email_verification";

    public EmailVerificationTokenService(IConfiguration configuration)
    {
        _jwtSecret = configuration["JWT:Secret"] ??
                    throw new InvalidOperationException("JWT:Secret is not configured");
        _jwtIssuer = configuration["JWT:Issuer"] ?? "Anchor";
        _jwtAudience = configuration["JWT:Audience"] ?? "Anchor";
        _tokenExpiryHours = configuration.GetValue<int>("EmailVerification:TokenExpiryHours", 24);
    }

    public Task<string> GenerateTokenAsync(Guid userId, CancellationToken cancellationToken)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        byte[] key = Encoding.ASCII.GetBytes(_jwtSecret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim("purpose", TokenPurpose),
                new Claim("jti", Guid.NewGuid().ToString())
            ]),
            Expires = DateTime.UtcNow.AddHours(_tokenExpiryHours),
            Issuer = _jwtIssuer,
            Audience = _jwtAudience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
        return Task.FromResult(tokenHandler.WriteToken(token));
    }

    public Task<Result<Guid>> ValidateTokenAsync(string token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(token))
        {
            return Task.FromResult(ResultExtensions.Failure<Guid>("Token is required"));
        }

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            byte[] key = Encoding.ASCII.GetBytes(_jwtSecret);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _jwtIssuer,
                ValidateAudience = true,
                ValidAudience = _jwtAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            ClaimsPrincipal principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);

            // Check token purpose
            Claim? purposeClaim = principal.Claims.FirstOrDefault(x => string.Equals(x.Type, "purpose", StringComparison.Ordinal));
            if (!string.Equals(purposeClaim?.Value, TokenPurpose, StringComparison.Ordinal))
            {
                return Task.FromResult(ResultExtensions.Failure<Guid>("Invalid token purpose"));
            }

            // Extract user ID
            Claim? userIdClaim = principal.Claims.FirstOrDefault(x => string.Equals(x.Type, ClaimTypes.NameIdentifier, StringComparison.Ordinal));
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                return Task.FromResult(ResultExtensions.Success(userId));
            }

            return Task.FromResult(ResultExtensions.Failure<Guid>("Invalid token claims"));
        }
        catch (SecurityTokenExpiredException)
        {
            return Task.FromResult(ResultExtensions.Failure<Guid>("Token has expired"));
        }
        catch (SecurityTokenSignatureKeyNotFoundException)
        {
            return Task.FromResult(ResultExtensions.Failure<Guid>("Invalid token signature"));
        }
        catch (SecurityTokenInvalidSignatureException)
        {
            return Task.FromResult(ResultExtensions.Failure<Guid>("Invalid token signature"));
        }
        catch (Exception)
        {
            return Task.FromResult(ResultExtensions.Failure<Guid>("Invalid token"));
        }
    }
}
