using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.CQRS;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Common.Errors;
using WorkFlo.Domain.Users;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Auth.Commands;

/// <summary>
/// OAuth authentication command handler supporting multiple providers
/// Implements privacy-first approach with minimal data collection
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
public sealed class HOAuthLogin : ICommandHandler<COAuthLogin, Result<COAuthLogin.Response>>
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailHashingService _emailHashingService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly Dictionary<string, IOAuthService> _oauthServices;

    public HOAuthLogin(
        IUserRepository userRepository,
        IEmailHashingService emailHashingService,
        IJwtTokenService jwtTokenService,
        IEnumerable<IOAuthService> oauthServices)
    {
        _userRepository = userRepository;
        _emailHashingService = emailHashingService;
        _jwtTokenService = jwtTokenService;
        _oauthServices = oauthServices.ToDictionary(s => s.ProviderName, s => s, StringComparer.OrdinalIgnoreCase);
    }

    public async Task<Result<COAuthLogin.Response>> Handle(COAuthLogin request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            // Find OAuth service for the requested provider
            if (!_oauthServices.TryGetValue(request.Provider, out IOAuthService? oauthService))
            {
                return Failure<COAuthLogin.Response>($"Unsupported OAuth provider: {request.Provider}");
            }

            // Authenticate with OAuth provider
            Result<OAuthUserInfo> authResult = await oauthService.AuthenticateAsync(
                request.AuthorizationCode,
                request.RedirectUri,
                cancellationToken).ConfigureAwait(false);

            if (!authResult.IsSuccess)
            {
                return Failure<COAuthLogin.Response>(authResult.Error!);
            }

            OAuthUserInfo oauthUserInfo = authResult.Value!;

            // Hash email for privacy compliance
            string emailHash = _emailHashingService.HashEmail(oauthUserInfo.Email);

            // Check if user already exists
            User? existingUser = await _userRepository.GetByEmailHashAsync(emailHash, cancellationToken).ConfigureAwait(false);
            bool isNewUser = existingUser == null;
            User user;

            if (isNewUser)
            {
                // Create new user for OAuth (no password required)
                TypeSafeResult<User, ValidationError> userCreationResult = User.Create(emailHash, "oauth_placeholder_hash");
                if (!userCreationResult.IsSuccess)
                {
                    return Failure<COAuthLogin.Response>(userCreationResult.Error.Message);
                }

                user = userCreationResult.Value;

                // Mark email as verified if OAuth provider verified it
                if (oauthUserInfo.EmailVerified)
                {
                    user.VerifyEmail();
                }

                await _userRepository.AddAsync(user, cancellationToken).ConfigureAwait(false);
            }
            else
            {
                user = existingUser!; // We know it's not null because isNewUser is false
            }

            // Generate JWT tokens
            string accessToken = await _jwtTokenService
                .GenerateAccessTokenAsync(user.Id, user.EmailHash, cancellationToken).ConfigureAwait(false);
            string refreshToken = await _jwtTokenService.GenerateRefreshTokenAsync(user.Id, cancellationToken)
                .ConfigureAwait(false);
            DateTime expiresAt = _jwtTokenService.GetTokenExpiryTime(request.RememberMe);

            var response = new COAuthLogin.Response
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                IsNewUser = isNewUser,
                User = new()
                {
                    Id = user.Id,
                    EmailHash = user.EmailHash,
                    EmailVerified = user.EmailVerified,
                    CreatedAt = user.CreatedAt,
                    PreferredName = oauthUserInfo.Name ?? "WorkFlo User"
                }
            };

            return Success(response);
        }
        catch (Exception ex)
        {
            return Failure<COAuthLogin.Response>($"Failed to authenticate with OAuth provider: {ex.Message}");
        }
    }
}
