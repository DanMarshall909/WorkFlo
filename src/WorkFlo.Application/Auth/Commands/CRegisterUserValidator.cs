using FluentValidation;

namespace WorkFlo.Application.Auth.Commands;

public sealed class CRegisterUserValidator : AbstractValidator<CRegisterUser>
{
    public CRegisterUserValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Please provide a valid email address")
            .MaximumLength(254)
            .WithMessage("Email cannot exceed 254 characters");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Password is required")
            .Must(password => !string.IsNullOrWhiteSpace(password))
            .WithMessage("Password cannot be only whitespace")
            .MinimumLength(8)
            .WithMessage("Password must be at least 8 characters long")
            .MaximumLength(128)
            .WithMessage("Password cannot exceed 128 characters");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty()
            .WithMessage("Password confirmation is required")
            .Equal(x => x.Password)
            .WithMessage("Passwords do not match");
    }
}
