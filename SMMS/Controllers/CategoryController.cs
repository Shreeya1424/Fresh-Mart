using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMMS.Data;
using SMMS.Models;

namespace SMMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class CategoryController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<CategoryDto> _validator;
        public CategoryController(SMDbContext db, IValidator<CategoryDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Public - anyone can view categories)
        [HttpGet]
        [AllowAnonymous] // Allow anonymous access to view categories
        public async Task<IActionResult> GetAllCategories()
        {
            try
            {
                var categories = await _db.Categories
                    .Include(c => c.SubCategories)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Categories retrieved successfully", 
                    data = categories 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting categories", 
                    error = ex.Message 
                });
            }
        }
        #endregion



        #region get by id (Public - anyone can view category details)
        [HttpGet("{CategoryId}")]
        [AllowAnonymous] // Allow anonymous access to view category details
        public async Task<IActionResult> GetByIdCategory(int CategoryId)
        {
            try
            {
                var category = await _db.Categories
                    .Include(c => c.SubCategories)
                    .Include(c => c.Products)
                    .FirstOrDefaultAsync(c => c.CategoryId == CategoryId);
                
                if (category == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Category not found" 
                    });

                return Ok(new { 
                    success = true, 
                    message = "Category retrieved successfully", 
                    data = category 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting category", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Store Owners and Admins only)
        [HttpPost]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> InsertCategory(CategoryDto category)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                // Check role - allow Admin or StoreOwner
                var user = await _db.Users.FindAsync(currentUserId);
                if (user?.Role != "Admin" && user?.Role != "StoreOwner")
                {
                    return Forbid();
                }

                var result = _validator.Validate(category);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Check if category with same name already exists
                bool exists = await _db.Categories
                    .AnyAsync(c => c.Name.ToLower() == category.Name.ToLower());
                if (exists)
                    return BadRequest(new { 
                        success = false, 
                        message = "Category with this name already exists" 
                    });

                var addCategory = new Category
                {
                    Name = category.Name,
                    IsActive = category.IsActive,
                    Description = category.Description,
                    IconName = category.IconName,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.Categories.Add(addCategory);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Category created successfully", 
                    data = addCategory 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating category", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Store Owners and Admins only)
        [HttpPut("{CategoryId}")]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> UpdateCategory(int CategoryId, CategoryDto category)
        {
            if (CategoryId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Category Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                // Check role - allow Admin or StoreOwner
                var user = await _db.Users.FindAsync(currentUserId);
                if (user?.Role != "Admin" && user?.Role != "StoreOwner")
                {
                    return Forbid();
                }

                category.CategoryId = CategoryId;
                var updateCategory = await _db.Categories.FindAsync(CategoryId);
                if (updateCategory == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Category not found" 
                    });

                // Check if another category with same name exists (excluding current category)
                bool nameExists = await _db.Categories
                    .AnyAsync(c => c.Name.ToLower() == category.Name.ToLower() && c.CategoryId != CategoryId);
                if (nameExists)
                    return BadRequest(new { 
                        success = false, 
                        message = "Another category with this name already exists" 
                    });

                updateCategory.Name = category.Name;
                updateCategory.IsActive = category.IsActive;
                updateCategory.Description = category.Description;
                updateCategory.IconName = category.IconName;
                updateCategory.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Category updated successfully", 
                    data = updateCategory 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating category", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners and Admins only)
        [HttpDelete("{CategoryId}")]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> DeleteCategory(int CategoryId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                // Check role - allow Admin or StoreOwner
                var user = await _db.Users.FindAsync(currentUserId);
                if (user?.Role != "Admin" && user?.Role != "StoreOwner")
                {
                    return Forbid();
                }

                var category = await _db.Categories
                    .Include(c => c.Products)
                    .Include(c => c.SubCategories)
                    .FirstOrDefaultAsync(c => c.CategoryId == CategoryId);
                
                if (category == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Category not found" 
                    });

                // Check if category has associated products
                if (category.Products?.Any() == true)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Cannot delete category with associated products. Please move or delete products first." 
                    });
                }

                // Check if category has associated subcategories
                if (category.SubCategories?.Any() == true)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Cannot delete category with associated subcategories. Please delete subcategories first." 
                    });
                }

                _db.Categories.Remove(category);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Category deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting category", 
                    error = ex.Message 
                });
            }
        }
        #endregion


    }
}
