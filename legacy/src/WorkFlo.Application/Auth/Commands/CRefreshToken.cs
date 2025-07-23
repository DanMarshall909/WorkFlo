using WorkFlo.Application.Common.CQRS;
using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Auth.Commands;

public sealed class CRefreshToken : ICommand<Result<CRefreshToken.Response>>
{
    public required string RefreshToken { get; init; }

    public sealed record Response
    {
        public required string AccessToken { get; init; }
        public required string RefreshToken { get; init; }
        public required DateTime ExpiresAt { get; init; }
    }
}
