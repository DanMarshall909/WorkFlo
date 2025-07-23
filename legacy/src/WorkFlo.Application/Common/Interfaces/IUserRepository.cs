using WorkFlo.Domain.Users;

namespace WorkFlo.Application.Common.Interfaces;

/// <summary>
/// Repository interface for user operations
/// </summary>
public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailHashAsync(string emailHash, CancellationToken cancellationToken = default);
    Task<User> CreateAsync(User user);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user);
    Task DeleteAsync(Guid id);
}
