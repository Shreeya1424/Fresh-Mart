using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class DeliveryStaffValidator : AbstractValidator<DeliveryStaffDTO>
    {
        public DeliveryStaffValidator()
        {
            RuleFor(x => x.StaffId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("StaffId must be a valid value.");

            RuleFor(x => x.UserId)
                .NotEmpty()
                .WithMessage("UserId is required.")
                .GreaterThan(0)
                .WithMessage("UserId must be greater than 0.");

            RuleFor(x => x.ZoneId)
                .GreaterThan(0)
                .WithMessage("ZoneId must be greater than 0.")
                .When(x => x.ZoneId.HasValue);

            RuleFor(x => x.VehicleType)
                .NotEmpty()
                .WithMessage("Vehicle type is required.")
                .MaximumLength(50)
                .WithMessage("Vehicle type must not exceed 50 characters.");

            RuleFor(x => x.VehicleNumber)
                .NotEmpty()
                .WithMessage("Vehicle number is required.")
                .MaximumLength(20)
                .WithMessage("Vehicle number must not exceed 20 characters.");

            RuleFor(x => x.LicenseNumber)
                .NotEmpty()
                .WithMessage("License number is required.")
                .MaximumLength(30)
                .WithMessage("License number must not exceed 30 characters.");

            RuleFor(x => x.MaxLoad)
                .InclusiveBetween(1, 10)
                .WithMessage("Max load must be between 1 and 10.");

            RuleFor(x => x.Status)
                .NotEmpty()
                .WithMessage("Status is required.")
                .Must(status =>
                    status == "Available" ||
                    status == "Busy" ||
                    status == "Inactive")
                .WithMessage("Invalid status.");

            RuleFor(x => x.TotalDeliveriesCompleted)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Total deliveries completed cannot be negative.");

            RuleFor(x => x.TotalEarnings)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Total earnings cannot be negative.");

            RuleFor(x => x.EmploymentStatus)
                .NotEmpty()
                .WithMessage("Employment status is required.")
                .Must(status =>
                    status == "Active" ||
                    status == "Inactive" ||
                    status == "Suspended")
                .WithMessage("Invalid employment status.");
        }
    }
}
