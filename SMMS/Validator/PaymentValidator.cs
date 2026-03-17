using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class PaymentValidator : AbstractValidator<PaymentDto>
    {
        public PaymentValidator()
        {
            RuleFor(x => x.PaymentId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("PaymentId must be a valid value.");

            RuleFor(x => x.OrderId)
                .NotEmpty()
                .WithMessage("OrderId is required.")
                .GreaterThan(0)
                .WithMessage("OrderId must be greater than 0.");

            RuleFor(x => x.Status)
                .NotEmpty()
                .WithMessage("Payment status is required.")
                .MaximumLength(20)
                .WithMessage("Status must not exceed 20 characters.")
                .Must(status =>
                    status == "Pending" ||
                    status == "Paid" ||
                    status == "Failed" ||
                    status == "Refunded")
                .WithMessage("Invalid payment status.");

            RuleFor(x => x.AmountPaid)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Amount paid cannot be negative.");

            RuleFor(x => x.TransactionId)
                .MaximumLength(100)
                .WithMessage("Transaction ID must not exceed 100 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.TransactionId));

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

            RuleFor(x => x.PaymentDate)
                .LessThanOrEqualTo(DateTime.Now)
                .WithMessage("Payment date cannot be in the future.")
                .When(x => x.PaymentDate.HasValue);

            RuleFor(x => x.CardNumber)
                .NotEmpty()
                .WithMessage("Card number is required for card payments.")
                .Matches(@"^\d{16}$")
                .WithMessage("Card number must be exactly 16 digits.")
                .When(x => x.PaymentMode == "Card");

            RuleFor(x => x.CardCvv)
                .NotEmpty()
                .WithMessage("CVV is required for card payments.")
                .Matches(@"^\d{3}$")
                .WithMessage("CVV must be exactly 3 digits.")
                .When(x => x.PaymentMode == "Card");

            RuleFor(x => x.CardExpiry)
                .NotEmpty()
                .WithMessage("Expiry date is required for card payments.")
                .Matches(@"^(0[1-9]|1[0-2])\/\d{2}$")
                .WithMessage("Expiry must be in MM/YY format.")
                .When(x => x.PaymentMode == "Card");

            RuleFor(x => x.UpiId)
                .NotEmpty()
                .WithMessage("UPI ID is required for UPI payments.")
                .Matches(@"^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{3,}$")
                .WithMessage("UPI ID must be in the format 'name@bank'.")
                .When(x => x.PaymentMode == "UPI");
        }
    }
}
