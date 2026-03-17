using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class UserValidator : AbstractValidator<UserDto>
    {
        public UserValidator()
        {
            RuleFor(x => x.UserId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("UserId must be a valid value.");

            RuleFor(x => x.UserName)
                 .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("User Name is required.")
                .MinimumLength(3).WithMessage("User Name must be at least 3 characters.")
                .MaximumLength(100).WithMessage("User Name must not exceed 100 characters.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Invalid email format.")
                .MaximumLength(150).WithMessage("Email must not exceed 150 characters.");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Phone number is required.")
                .Matches(@"^\d{10,15}$")
                .WithMessage("Phone number must be 10–15 digits.");

            RuleFor(x => x.Password)
                 .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Password is required.")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
                .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
                .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
                .Matches("[0-9]").WithMessage("Password must contain at least one number.")
                .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");

            RuleFor(x => x.ProfileImageUrl)
                .MaximumLength(300).WithMessage("Profile image URL must not exceed 300 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.ProfileImageUrl));

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role is required.")
                .Must(role =>
                    role == "Customer" ||
                    role == "DeliveryStaff" ||
                    role == "StoreOwner")
                .WithMessage("Invalid role.");

            RuleFor(x => x.IsActive)
                .NotNull().WithMessage("IsActive must be specified.");
        }
    }
}
