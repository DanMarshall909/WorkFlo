using WorkFlo.Application.Common.CQRS;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Auth.Commands;

public sealed class COAuthLogin : ICommand<Result<COAuthLogin.Response>>
{
    public required string Provider { get; init; }
    public required string AuthorizationCode { get; init; }
    public string? RedirectUri { get; init; }
    public bool RememberMe { get; init; } = false;

    public sealed record Response
    {
        public required string AccessToken { get; init; }
        public required string RefreshToken { get; init; }
        public required DateTime ExpiresAt { get; init; }
        public required UserInfo User { get; init; }
        public required bool IsNewUser { get; init; }
    }

    public sealed record UserInfo
    {
        public required Guid Id { get; init; }
        public required string EmailHash { get; init; }
        public required bool EmailVerified { get; init; }
        public required DateTime CreatedAt { get; init; }
        public string? PreferredName { get; init; }
    }
}
