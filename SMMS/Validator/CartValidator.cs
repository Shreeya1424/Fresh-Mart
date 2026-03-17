using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class CartValidator : AbstractValidator<CartDTO>
    {
        public CartValidator()
        {
            RuleFor(x => x.CartId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("CartId must be a valid value.");

            RuleFor(x => x.CustomerId)
                .NotEmpty()
                .WithMessage("CustomerId is required.")
                .GreaterThan(0)
                .WithMessage("CustomerId must be greater than 0.");
        }
    }
}
