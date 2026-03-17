using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class CustomerValidator : AbstractValidator<CustomerDto>
    {
        public CustomerValidator()
        {
            RuleFor(x => x.CustomerId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("CustomerId must be a valid value.");

            RuleFor(x => x.UserId)
                .NotEmpty()
                .WithMessage("UserId is required.")
                .GreaterThan(0)
                .WithMessage("UserId must be greater than 0.");

            RuleFor(x => x.Address)
                .MaximumLength(200)
                .WithMessage("Address must not exceed 200 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Address));

            RuleFor(x => x.City)
                .MaximumLength(100)
                .WithMessage("City must not exceed 100 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.City));

            RuleFor(x => x.State)
                .MaximumLength(100)
                .WithMessage("State must not exceed 100 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.State));

            RuleFor(x => x.Pincode)
                .Matches(@"^\d{6}$")
                .WithMessage("Pincode must be exactly 6 digits.")
                .When(x => !string.IsNullOrWhiteSpace(x.Pincode));
        }
    }
}
