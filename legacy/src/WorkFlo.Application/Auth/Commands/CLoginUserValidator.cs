using FluentValidation;

namespace WorkFlo.Application.Auth.Commands;

public sealed class CLoginUserValidator : AbstractValidator<CLoginUser>
{
    public CLoginUserValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Please provide a valid email address");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Password is required");
    }
}
