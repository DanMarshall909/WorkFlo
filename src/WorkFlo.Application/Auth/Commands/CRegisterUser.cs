using WorkFlo.Application.Common.CQRS;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Auth.Commands;

public sealed class CRegisterUser : ICommand<Result<CRegisterUser.Response>>
{
    public required string Email { get; init; }
    public required string Password { get; init; }
    public required string ConfirmPassword { get; init; }

    public sealed record Response
    {
        public required Guid UserId { get; init; }
        public string? AccessToken { get; init; }
        public string? RefreshToken { get; init; }
        public DateTime? ExpiresAt { get; init; }
        public required UserInfo User { get; init; }
        public required bool EmailVerificationRequired { get; init; }
        public required string Message { get; init; }
    }

    public sealed record UserInfo
    {
        public required Guid Id { get; init; }
        public required string EmailHash { get; init; }
        public required bool EmailVerified { get; init; }
        public required DateTime CreatedAt { get; init; }
    }
}
