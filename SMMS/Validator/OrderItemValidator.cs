using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class OrderItemValidator : AbstractValidator<OrderItemDto>
    {
        public OrderItemValidator()
        {
            RuleFor(x => x.OrderItemId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("OrderItemId must be a valid value.");

            RuleFor(x => x.OrderId)
                .NotEmpty()
                .WithMessage("OrderId is required.")
                .GreaterThan(0)
                .WithMessage("OrderId must be greater than 0.");

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

            RuleFor(x => x.UnitPrice)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Unit price cannot be negative.");

            RuleFor(x => x.TotalPrice)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Total price cannot be negative.")
                .When(x => x.TotalPrice.HasValue);
        }
    }
}
