using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class ZoneValidator : AbstractValidator<ZoneDto>
    {
        public ZoneValidator()
        {
            RuleFor(x => x.ZoneId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("ZoneId must be a valid value.");

            RuleFor(x => x.ZoneName)
                .NotEmpty()
                .WithMessage("Zone name is required.")
                .MinimumLength(3)
                .WithMessage("Zone name must be at least 3 characters.")
                .MaximumLength(100)
                .WithMessage("Zone name must not exceed 100 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(300)
                .WithMessage("Description must not exceed 300 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Description));

            RuleFor(x => x.PincodeNumber)
                .InclusiveBetween(100000, 999999)
                .WithMessage("Pincode number must be a valid 6-digit value.")
                .When(x => x.PincodeNumber.HasValue);

            RuleFor(x => x.City)
                .NotEmpty()
                .WithMessage("City is required.")
                .MaximumLength(100)
                .WithMessage("City must not exceed 100 characters.");

            RuleFor(x => x.State)
                .NotEmpty()
                .WithMessage("State is required.")
                .MaximumLength(100)
                .WithMessage("State must not exceed 100 characters.");

            RuleFor(x => x.Country)
                .NotEmpty()
                .WithMessage("Country is required.")
                .MaximumLength(100)
                .WithMessage("Country must not exceed 100 characters.");

            RuleFor(x => x.IsActive)
                .NotNull()
                .WithMessage("IsActive must be specified.");
        }
    }
}
