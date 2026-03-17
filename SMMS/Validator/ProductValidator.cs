using FluentValidation;
using SMMS.Models;

namespace SMMS.Validator
{
    public class ProductValidator : AbstractValidator<ProductDto>
    {
        public ProductValidator()
        {
            RuleFor(x => x.ProductId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("ProductId must be a valid value.");

            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Product name is required.")
                .MinimumLength(3)
                .WithMessage("Product name must be at least 3 characters.")
                .MaximumLength(150)
                .WithMessage("Product name must not exceed 150 characters.");

            RuleFor(x => x.Brand)
                .MaximumLength(100)
                .WithMessage("Brand must not exceed 100 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Brand));

            RuleFor(x => x.CategoryId)
                .NotEmpty()
                .WithMessage("CategoryId is required.")
                .GreaterThan(0)
                .WithMessage("CategoryId must be greater than 0.");

            RuleFor(x => x.Price)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Price cannot be negative.");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("Description must not exceed 500 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Description));

            RuleFor(x => x.ImageUrl)
                .MaximumLength(300)
                .WithMessage("Image URL must not exceed 300 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.ImageUrl));

            RuleFor(x => x.CurrentStock)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Current stock cannot be negative.");

            RuleFor(x => x.LowStockValue)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Low stock value cannot be negative.");

            RuleFor(x => x.StoreOwnerId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("StoreOwnerId must be a valid value.");

            RuleFor(x => x.SubCategoryId)
                .GreaterThan(0)
                .WithMessage("SubCategoryId must be greater than 0.")
                .When(x => x.SubCategoryId.HasValue);
        }
    }
}
