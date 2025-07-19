using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Infrastructure.Data;
using WorkFlo.Infrastructure.Data.Models.Identity;
using Microsoft.EntityFrameworkCore;

namespace WorkFlo.Infrastructure.Configuration;

public class UserRepository(WorkFloDbContext context) : IUserRepository
{
    private readonly WorkFloDbContext _context = context;

    public async Task<WorkFlo.Domain.Users.User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        User? user = await _context.Users
            .Include(u => u.Preferences)
            .FirstOrDefaultAsync(u => u.Id == id && u.IsActive, cancellationToken)
            .ConfigureAwait(false);
        return user?.ToDomain();
    }

    public async Task<WorkFlo.Domain.Users.User?> GetByEmailHashAsync(string emailHash,
        CancellationToken cancellationToken = default)
    {
        User? user = await _context.Users
            .Include(u => u.Preferences)
            .FirstOrDefaultAsync(u => u.EmailHash == emailHash && u.IsActive, cancellationToken)
            .ConfigureAwait(false);
        return user?.ToDomain();
    }

    public async Task<WorkFlo.Domain.Users.User> CreateAsync(WorkFlo.Domain.Users.User user)
    {
        var infrastructureUser = new User
        {
            Id = user.Id,
            EmailHash = user.EmailHash,
            PasswordHash = user.PasswordHash,
            EmailVerified = user.EmailVerified,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt ?? DateTimeOffset.UtcNow
        };

        _context.Users.Add(infrastructureUser);
        await _context.SaveChangesAsync().ConfigureAwait(false);
        return infrastructureUser.ToDomain();
    }

    public Task AddAsync(WorkFlo.Domain.Users.User user, CancellationToken cancellationToken = default)
    {
        var infrastructureUser = new User
        {
            Id = user.Id,
            EmailHash = user.EmailHash,
            PasswordHash = user.PasswordHash,
            EmailVerified = user.EmailVerified,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt ?? DateTimeOffset.UtcNow
        };

        _context.Users.Add(infrastructureUser);
        return _context.SaveChangesAsync(cancellationToken);
    }

    public async System.Threading.Tasks.Task UpdateAsync(WorkFlo.Domain.Users.User user)
    {
        ArgumentNullException.ThrowIfNull(user);

        User? existingUser = await _context.Users.FindAsync(user.Id).ConfigureAwait(false);
        if (existingUser != null)
        {
            existingUser.EmailHash = user.EmailHash;
            existingUser.PasswordHash = user.PasswordHash;
            existingUser.EmailVerified = user.EmailVerified;
            existingUser.IsActive = user.IsActive;
            existingUser.UpdatedAt = DateTimeOffset.UtcNow;

            _context.Users.Update(existingUser);
            await _context.SaveChangesAsync().ConfigureAwait(false);
        }
    }

    public async System.Threading.Tasks.Task DeleteAsync(Guid id)
    {
        User? user = await _context.Users.FindAsync(id).ConfigureAwait(false);
        if (user != null)
        {
            user.IsActive = false;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync().ConfigureAwait(false);
        }
    }
}
