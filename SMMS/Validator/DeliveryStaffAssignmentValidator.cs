using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class DeliveryStaffAssignmentValidator : AbstractValidator<DeliveryStaffAssignmentDto>
    {
        public DeliveryStaffAssignmentValidator()
        {
            RuleFor(x => x.AssignmentId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("AssignmentId must be a valid value.");

            RuleFor(x => x.StaffId)
                .NotEmpty()
                .WithMessage("StaffId is required.")
                .GreaterThan(0)
                .WithMessage("StaffId must be greater than 0.");

            RuleFor(x => x.OrderId)
                .NotEmpty()
                .WithMessage("OrderId is required.")
                .GreaterThan(0)
                .WithMessage("OrderId must be greater than 0.");

            RuleFor(x => x.AssignedDate)
                .NotEmpty()
                .WithMessage("Assigned date is required.")
                .LessThanOrEqualTo(DateTime.Now)
                .WithMessage("Assigned date cannot be in the future.");

            RuleFor(x => x.Status)
                .NotEmpty()
                .WithMessage("Status is required.")
                .MaximumLength(20)
                .WithMessage("Status must not exceed 20 characters.")
                .Must(status =>
                    status == "Assigned" ||
                    status == "InProgress" ||
                    status == "Completed" ||
                    status == "Cancelled")
                .WithMessage("Invalid status.");

            RuleFor(x => x.Note)
                .MaximumLength(500)
                .WithMessage("Note must not exceed 500 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Note));
        }
    }
}
