using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class FeedbackValidator : AbstractValidator<FeedbackDto>
    {
        public FeedbackValidator()
        {
            RuleFor(x => x.FeedbackId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("FeedbackId must be a valid value.");

            RuleFor(x => x.UserId)
                .NotEmpty()
                .WithMessage("UserId is required.")
                .GreaterThan(0)
                .WithMessage("UserId must be greater than 0.");

            RuleFor(x => x.OrderId)
                .GreaterThan(0)
                .WithMessage("OrderId must be greater than 0.")
                .When(x => x.OrderId.HasValue);

            RuleFor(x => x.ProductId)
                .GreaterThan(0)
                .WithMessage("ProductId must be greater than 0.")
                .When(x => x.ProductId.HasValue);

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5)
                .WithMessage("Rating must be between 1 and 5.");

            RuleFor(x => x.Comment)
                .MaximumLength(500)
                .WithMessage("Comment must not exceed 500 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Comment));

            RuleFor(x => x.FeedbackTargetType)
                .NotEmpty()
                .WithMessage("Feedback target type is required.")
                .MaximumLength(20)
                .WithMessage("Feedback target type must not exceed 20 characters.")
                .Must(type =>
                    type == "Order" ||
                    type == "Product" ||
                    type == "DeliveryStaff" ||
                    type == "Store")
                .WithMessage("Invalid feedback target type.");
        }
    }
}
