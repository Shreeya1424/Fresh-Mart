using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class StoreProfileValidator : AbstractValidator<StoreProfileDto>
    {
        public StoreProfileValidator()
        {
            RuleFor(x => x.StoreId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("StoreId must be a valid value.");

            RuleFor(x => x.StoreName)
                .NotEmpty()
                .WithMessage("Store name is required.")
                .MinimumLength(3)
                .WithMessage("Store name must be at least 3 characters.")
                .MaximumLength(150)
                .WithMessage("Store name must not exceed 150 characters.");

            RuleFor(x => x.OwnerId)
                .NotEmpty()
                .WithMessage("OwnerId is required.")
                .GreaterThan(0)
                .WithMessage("OwnerId must be greater than 0.");

            RuleFor(x => x.Address)
                .NotEmpty()
                .WithMessage("Address is required.")
                .MaximumLength(300)
                .WithMessage("Address must not exceed 300 characters.");

            RuleFor(x => x.Phone)
                .NotEmpty()
                .WithMessage("Phone number is required.")
                .Matches(@"^\d{10,15}$")
                .WithMessage("Phone number must be 10–15 digits.");

            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email is required.")
                .EmailAddress()
                .WithMessage("Invalid email format.")
                .MaximumLength(150)
                .WithMessage("Email must not exceed 150 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("Description must not exceed 500 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Description));

            RuleFor(x => x.DeliveryRadiusKm)
                .InclusiveBetween(0, 100)
                .WithMessage("Delivery radius must be between 0 and 100 km.");

            RuleFor(x => x.OpeningTime)
                .NotEmpty()
                .WithMessage("Opening time is required.");

            RuleFor(x => x.ClosingTime)
                .NotEmpty()
                .WithMessage("Closing time is required.")
                .GreaterThan(x => x.OpeningTime)
                .WithMessage("Closing time must be after opening time.");

            RuleFor(x => x.Gstnumber)
                .NotEmpty()
                .WithMessage("GST number is required.")
                .MaximumLength(20)
                .WithMessage("GST number must not exceed 20 characters.");
        }
    }
}
