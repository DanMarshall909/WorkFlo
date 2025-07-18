using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Domain.Users;
using MediatR;

namespace WorkFlo.Application.Auth.Queries;

/// <summary>
/// Handler for getting current user information.
/// </summary>
public sealed class HGetCurrentUser : IRequestHandler<QGetCurrentUser, QGetCurrentUser.Response?>
{
    private readonly IUserRepository _userRepository;

    public HGetCurrentUser(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    /// <summary>
    /// Handles getting current user information by user ID.
    /// </summary>
    /// <param name="request">The query containing user ID.</param>
    /// <param name="cancellationToken">Cancellation token for the operation.</param>
    /// <returns>User information or null if not found.</returns>
    public async Task<QGetCurrentUser.Response?> Handle(QGetCurrentUser request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);

        User? user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken).ConfigureAwait(false);
        if (user == null || !user.IsActive)
        {
            return null;
        }

        return new()
        {
            Id = user.Id,
            EmailHash = user.EmailHash,
            EmailVerified = user.EmailVerified,
            CreatedAt = user.CreatedAt,
            IsActive = user.IsActive
        };
    }
}
