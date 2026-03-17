using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class OrderValidator : AbstractValidator<OrderDto>
    {
        public OrderValidator()
        {
            RuleFor(x => x.OrderId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("OrderId must be a valid value.");

            RuleFor(x => x.CustomerId)
                .NotEmpty()
                .WithMessage("CustomerId is required.")
                .GreaterThan(0)
                .WithMessage("CustomerId must be greater than 0.");

            RuleFor(x => x.OrderDate)
                .NotEmpty()
                .WithMessage("Order date is required.")
                .LessThanOrEqualTo(DateTime.Now)
                .WithMessage("Order date cannot be in the future.");

            RuleFor(x => x.OrderNumber)
                .MaximumLength(50)
                .WithMessage("Order number must not exceed 50 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.OrderNumber));

            RuleFor(x => x.Status)
                .NotEmpty()
                .WithMessage("Order status is required.")
                .MaximumLength(20)
                .WithMessage("Status must not exceed 20 characters.")
                .Must(status =>
                    status == "Pending" ||
                    status == "Confirmed" ||
                    status == "Cancelled" ||
                    status == "Delivered")
                .WithMessage("Invalid order status.");

            RuleFor(x => x.PaymentMode)
                .NotEmpty()
                .WithMessage("Payment mode is required.")
                .MaximumLength(20)
                .WithMessage("Payment mode must not exceed 20 characters.")
                .Must(mode =>
                    mode == "Cash" ||
                    mode == "Card" ||
                    mode == "UPI" ||
                    mode == "NetBanking")
                .WithMessage("Invalid payment mode.");

            RuleFor(x => x.TotalAmount)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Total amount cannot be negative.");

            RuleFor(x => x.DeliveryCharge)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Delivery charge cannot be negative.");

            RuleFor(x => x.FinalAmount)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Final amount cannot be negative.")
                .When(x => x.FinalAmount.HasValue);

            RuleFor(x => x.CancelledReason)
                .NotEmpty()
                .WithMessage("Cancelled reason is required when order is cancelled.")
                .MaximumLength(300)
                .WithMessage("Cancelled reason must not exceed 300 characters.")
                .When(x => x.Status == "Cancelled");

            RuleFor(x => x.TrackingNumber)
                .MaximumLength(50)
                .WithMessage("Tracking number must not exceed 50 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.TrackingNumber));

            RuleFor(x => x.EstimatedDeliveryDate)
                .GreaterThanOrEqualTo(x => x.OrderDate)
                .WithMessage("Estimated delivery date must be after order date.")
                .When(x => x.EstimatedDeliveryDate.HasValue);

            RuleFor(x => x.DeliveredDate)
                .GreaterThanOrEqualTo(x => x.OrderDate)
                .WithMessage("Delivered date must be after order date.")
                .When(x => x.DeliveredDate.HasValue);
        }
    }
}
