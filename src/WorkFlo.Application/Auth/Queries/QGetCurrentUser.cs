using WorkFlo.Application.Common.CQRS;
using MediatR;

namespace WorkFlo.Application.Auth.Queries;

public sealed class QGetCurrentUser : IQuery<QGetCurrentUser.Response?>
{
    public required Guid UserId { get; init; }

    public sealed record Response
    {
        public required Guid Id { get; init; }
        public required string EmailHash { get; init; }
        public required bool EmailVerified { get; init; }
        public required DateTime CreatedAt { get; init; }
        public required bool IsActive { get; init; }
    }
}
