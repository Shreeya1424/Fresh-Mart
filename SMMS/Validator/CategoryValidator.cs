using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class CategoryValidator : AbstractValidator<CategoryDto>
    {
        public CategoryValidator()
        {
            RuleFor(x => x.CategoryId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("CategoryId must be a valid value.");

            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Category name is required.")
                .MinimumLength(3)
                .WithMessage("Category name must be at least 3 characters.")
                .MaximumLength(100)
                .WithMessage("Category name must not exceed 100 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(300)
                .WithMessage("Description must not exceed 300 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Description));

            RuleFor(x => x.IconName)
                .MaximumLength(100)
                .WithMessage("Icon name must not exceed 100 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.IconName));

            RuleFor(x => x.IsActive)
                .NotNull()
                .WithMessage("IsActive must be specified.");
        }
    }
}
