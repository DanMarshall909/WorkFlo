using WorkFlo.Domain.Common;

namespace WorkFlo.Application.Services;

public interface IEmailService
{
    Task<Result> SendVerificationEmailAsync(string email, string token, string userName, CancellationToken cancellationToken = default);
    Task<Result> SendPasswordResetEmailAsync(string email, string token, string userName, CancellationToken cancellationToken = default);
    Task<Result> SendNotificationEmailAsync(string email, string subject, string message, CancellationToken cancellationToken = default);
}
