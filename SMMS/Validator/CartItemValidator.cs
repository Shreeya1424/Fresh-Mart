using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class CartItemValidator : AbstractValidator<CartItemDTO>
    {
        public CartItemValidator()
        {
            RuleFor(x => x.CartItemId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("CartItemId must be a valid value.");

            RuleFor(x => x.CartId)
                .NotEmpty()
                .WithMessage("CartId is required.")
                .GreaterThan(0)
                .WithMessage("CartId must be greater than 0.");

            RuleFor(x => x.ProductId)
                .NotEmpty()
                .WithMessage("ProductId is required.")
                .GreaterThan(0)
                .WithMessage("ProductId must be greater than 0.");

            RuleFor(x => x.Quantity)
                .NotEmpty()
                .WithMessage("Quantity is required.")
                .InclusiveBetween(1, 100)
                .WithMessage("Quantity must be between 1 and 100.");
        }
    }
}
