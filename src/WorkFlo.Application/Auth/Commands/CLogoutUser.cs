using WorkFlo.Application.Common.CQRS;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Auth.Commands;

public sealed class CLogoutUser : ICommand<Result>
{
    public required string RefreshToken { get; init; }
    public required Guid UserId { get; init; }
}
