using System.Text.RegularExpressions;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using Microsoft.Extensions.Logging;

namespace WorkFlo.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Result> SendVerificationEmailAsync(string email, string token, string userName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return Result.Failure("Email address is required");
        }

        if (!IsValidEmail(email))
        {
            return Result.Failure("Invalid email format");
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return Result.Failure("Verification token is required");
        }

        return await SendEmailAsync(
            $"Sending verification email to {email}").ConfigureAwait(false);
    }

    public async Task<Result> SendPasswordResetEmailAsync(string email, string token, string userName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return Result.Failure("Email address is required");
        }

        if (!IsValidEmail(email))
        {
            return Result.Failure("Invalid email format");
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return Result.Failure("Reset token is required");
        }

        return await SendEmailAsync(
            $"Sending password reset email to {email}").ConfigureAwait(false);
    }

    public async Task<Result> SendNotificationEmailAsync(string email, string subject, string message, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return Result.Failure("Email address is required");
        }

        if (!IsValidEmail(email))
        {
            return Result.Failure("Invalid email format");
        }

        if (string.IsNullOrWhiteSpace(subject))
        {
            return Result.Failure("Subject is required");
        }

        return await SendEmailAsync(
            $"Sending notification email to {email} with subject: {subject}").ConfigureAwait(false);
    }

    private async Task<Result> SendEmailAsync(string logMessage)
    {
        _logger.LogInformation("{LogMessage}", logMessage);

        // TODO: Implement actual email sending logic
        await Task.CompletedTask.ConfigureAwait(false);

        return Result.Success();
    }

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        // Basic email validation regex
        const string emailPattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
        return Regex.IsMatch(email, emailPattern, RegexOptions.IgnoreCase);
    }
}
