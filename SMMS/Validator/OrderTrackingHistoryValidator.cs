using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class OrderTrackingHistoryValidator : AbstractValidator<OrderTrackingHistoryDto>
    {
        public OrderTrackingHistoryValidator()
        {
            RuleFor(x => x.TrackingId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("TrackingId must be a valid value.");

            RuleFor(x => x.OrderId)
                .NotEmpty()
                .WithMessage("OrderId is required.")
                .GreaterThan(0)
                .WithMessage("OrderId must be greater than 0.");

            RuleFor(x => x.Status)
                .NotEmpty()
                .WithMessage("Status is required.")
                .MaximumLength(30)
                .WithMessage("Status must not exceed 30 characters.")
                .Must(status =>
                    status == "Order Placed" ||
                    status == "Confirmed" ||
                    status == "Packed" ||
                    status == "Out for Delivery" ||
                    status == "Delivered" ||
                    status == "Cancelled")
                .WithMessage("Invalid order tracking status.");

            RuleFor(x => x.StatusTime)
                .NotEmpty()
                .WithMessage("Status time is required.")
                .LessThanOrEqualTo(DateTime.Now)
                .WithMessage("Status time cannot be in the future.");

            RuleFor(x => x.Location)
                .MaximumLength(100)
                .WithMessage("Location must not exceed 100 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Location));

            RuleFor(x => x.Note)
                .MaximumLength(300)
                .WithMessage("Note must not exceed 300 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Note));
        }
    }
}
