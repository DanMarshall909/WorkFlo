using MediatR;

namespace WorkFlo.Application.Auth.Queries;

public sealed class QValidateRefreshToken : IRequest<QValidateRefreshToken.Response?>
{
    public required string RefreshToken { get; init; }

    public sealed record Response
    {
        public required Guid UserId { get; init; }
        public required bool IsValid { get; init; }
        public required DateTime ExpiresAt { get; init; }
    }
}
