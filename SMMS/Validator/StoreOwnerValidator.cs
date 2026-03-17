using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class StoreOwnerValidator : AbstractValidator<StoreOwnerDto>
    {
        public StoreOwnerValidator()
        {
            RuleFor(x => x.StoreOwnerId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("StoreOwnerId must be a valid value.");

            RuleFor(x => x.UserId)
                .NotEmpty()
                .WithMessage("UserId is required.")
                .GreaterThan(0)
                .WithMessage("UserId must be greater than 0.");
        }
    }
}
