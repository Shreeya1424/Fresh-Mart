using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class SubCategoryValidator : AbstractValidator<SubCategoryDto>
    {
        public SubCategoryValidator()
        {
            RuleFor(x => x.SubCategoryId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("SubCategoryId must be a valid value.");

            RuleFor(x => x.SubCategoryName)
                .NotEmpty()
                .WithMessage("Sub-category name is required.")
                .MinimumLength(3)
                .WithMessage("Sub-category name must be at least 3 characters.")
                .MaximumLength(100)
                .WithMessage("Sub-category name must not exceed 100 characters.");

            RuleFor(x => x.CategoryId)
                .NotEmpty()
                .WithMessage("CategoryId is required.")
                .GreaterThan(0)
                .WithMessage("CategoryId must be greater than 0.");
        }
    }
}
