using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using WorkFlo.Application.Auth.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace WorkFlo.Infrastructure.Services.Auth;

/// <summary>
/// JWT token service implementation for generating and validating JWT tokens
/// </summary>
public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly Dictionary<string, RefreshTokenInfo> _refreshTokens = [];
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
        _jwtSecret = _configuration["JWT:Secret"] ??
                     throw new InvalidOperationException("JWT:Secret is not configured");
        _jwtIssuer = _configuration["JWT:Issuer"] ?? "WorkFlo";
        _jwtAudience = _configuration["JWT:Audience"] ?? "WorkFlo";
    }

    public Task<string> GenerateAccessTokenAsync(Guid userId, string emailHash,
        CancellationToken cancellationToken = default)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        byte[] key = Encoding.ASCII.GetBytes(_jwtSecret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new([
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()), new Claim(ClaimTypes.Email, emailHash),
                new Claim("jti", Guid.NewGuid().ToString())
            ]),
            Expires = DateTime.UtcNow.AddMinutes(15), // Short-lived access token
            Issuer = _jwtIssuer,
            Audience = _jwtAudience,
            SigningCredentials = new(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        SecurityToken? token = tokenHandler.CreateToken(tokenDescriptor);
        return Task.FromResult(tokenHandler.WriteToken(token));
    }

    public async Task<string> GenerateRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        byte[] randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);

        string refreshToken = Convert.ToBase64String(randomNumber);
        DateTime expiryTime = DateTime.UtcNow.AddDays(7); // Refresh token valid for 7 days

        _refreshTokens[refreshToken] = new() { UserId = userId, ExpiresAt = expiryTime, IsRevoked = false };

        return await Task.FromResult(refreshToken).ConfigureAwait(false);
    }

    public async Task<bool> ValidateTokenAsync(string token, CancellationToken cancellationToken = default)
    {
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

            tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            return await Task.FromResult(true).ConfigureAwait(false);
        }
        catch
        {
            return await Task.FromResult(false).ConfigureAwait(false);
        }
    }

    public async Task<Guid?> GetUserIdFromTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            JwtSecurityToken? jsonToken = tokenHandler.ReadJwtToken(token);

            Claim? userIdClaim = jsonToken.Claims.FirstOrDefault(x => string.Equals(x.Type, "nameid", StringComparison.Ordinal));
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                return await Task.FromResult(userId).ConfigureAwait(false);
            }
        }
        catch
        {
            // Token is invalid
        }

        return await Task.FromResult<Guid?>(null).ConfigureAwait(false);
    }

    public Task<bool> ValidateRefreshTokenAsync(string refreshToken, Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (!_refreshTokens.TryGetValue(refreshToken, out RefreshTokenInfo? tokenInfo))
        {
            return Task.FromResult(false);
        }

        bool isValid = tokenInfo.UserId == userId &&
                       !tokenInfo.IsRevoked &&
                       tokenInfo.ExpiresAt > DateTime.UtcNow;

        return Task.FromResult(isValid);
    }

    public Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (_refreshTokens.TryGetValue(refreshToken, out RefreshTokenInfo? tokenInfo))
        {
            tokenInfo.IsRevoked = true;
        }

        return Task.CompletedTask;
    }

    public DateTime GetTokenExpiryTime(bool isRememberMe = false)
    {
        // Access tokens are always short-lived (15 minutes)
        // Refresh tokens can be longer for remember me
        return isRememberMe ? DateTime.UtcNow.AddDays(30) : DateTime.UtcNow.AddDays(7);
    }

    private class RefreshTokenInfo
    {
        public Guid UserId { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
    }
}
