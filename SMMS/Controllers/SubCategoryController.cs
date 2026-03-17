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
    public class SubCategoryController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<SubCategoryDto> _validator;
        public SubCategoryController(SMDbContext db, IValidator<SubCategoryDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Public - anyone can view subcategories)
        [HttpGet]
        [AllowAnonymous] // Allow anonymous access to view subcategories
        public async Task<IActionResult> GetAllSubCategories()
        {
            try
            {
                var subCategories = await _db.SubCategories
                    .Include(sc => sc.Category)
                    .Where(sc => sc.Category.IsActive) // Filter by parent category active status
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Sub categories retrieved successfully", 
                    data = subCategories 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting sub categories", 
                    error = ex.Message 
                });
            }
        }
        #endregion



        #region get by id (Public - anyone can view subcategory details)
        [HttpGet("{SubCategoryId}")]
        [AllowAnonymous] // Allow anonymous access to view subcategory details
        public async Task<IActionResult> GetByIdSubCategory(int SubCategoryId)
        {
            try
            {
                var subCategory = await _db.SubCategories
                    .Include(sc => sc.Category)
                    .Include(sc => sc.Products.Where(p => p.IsActive))
                    .FirstOrDefaultAsync(sc => sc.SubCategoryId == SubCategoryId);
                
                if (subCategory == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Sub category not found" 
                    });

                return Ok(new { 
                    success = true, 
                    message = "Sub category retrieved successfully", 
                    data = subCategory 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting sub category", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Store Owners only)
        [HttpPost]
        [Authorize(Roles = "StoreOwner")] // Only store owners can create subcategories
        public async Task<IActionResult> InsertSubCategory(SubCategoryDto subCategory)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var result = _validator.Validate(subCategory);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Check if parent category exists and is active
                var category = await _db.Categories.FindAsync(subCategory.CategoryId);
                if (category == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Parent category not found" 
                    });

                if (!category.IsActive)
                    return BadRequest(new { 
                        success = false, 
                        message = "Cannot create subcategory under inactive category" 
                    });

                // Check if subcategory with same name already exists in the same category
                bool exists = await _db.SubCategories
                    .AnyAsync(sc => sc.SubCategoryName.ToLower() == subCategory.SubCategoryName.ToLower() 
                                   && sc.CategoryId == subCategory.CategoryId);
                if (exists)
                    return BadRequest(new { 
                        success = false, 
                        message = "Sub category with this name already exists in the selected category" 
                    });

                var addSubCategory = new SubCategory
                {
                    SubCategoryName = subCategory.SubCategoryName,
                    CategoryId = subCategory.CategoryId
                };

                _db.SubCategories.Add(addSubCategory);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Sub category created successfully", 
                    data = addSubCategory 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating sub category", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Store Owners only)
        [HttpPut("{SubCategoryId}")]
        [Authorize(Roles = "StoreOwner")] // Only store owners can update subcategories
        public async Task<IActionResult> UpdateSubCategory(int SubCategoryId, SubCategoryDto subCategory)
        {
            if (SubCategoryId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Sub Category Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                subCategory.SubCategoryId = SubCategoryId;
                var updateSubCategory = await _db.SubCategories.FindAsync(SubCategoryId);
                if (updateSubCategory == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Sub category not found" 
                    });

                // Check if parent category exists and is active
                var category = await _db.Categories.FindAsync(subCategory.CategoryId);
                if (category == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Parent category not found" 
                    });

                // Check if another subcategory with same name exists in the same category (excluding current subcategory)
                bool nameExists = await _db.SubCategories
                    .AnyAsync(sc => sc.SubCategoryName.ToLower() == subCategory.SubCategoryName.ToLower() 
                                   && sc.CategoryId == subCategory.CategoryId 
                                   && sc.SubCategoryId != SubCategoryId);
                if (nameExists)
                    return BadRequest(new { 
                        success = false, 
                        message = "Another sub category with this name already exists in the selected category" 
                    });

                updateSubCategory.SubCategoryName = subCategory.SubCategoryName;
                updateSubCategory.CategoryId = subCategory.CategoryId;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Sub category updated successfully", 
                    data = updateSubCategory 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating sub category", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners only)
        [HttpDelete("{SubCategoryId}")]
        [Authorize(Roles = "StoreOwner")] // Only store owners can delete subcategories
        public async Task<IActionResult> DeleteSubCategory(int SubCategoryId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var subCategory = await _db.SubCategories
                    .Include(sc => sc.Products)
                    .FirstOrDefaultAsync(sc => sc.SubCategoryId == SubCategoryId);
                
                if (subCategory == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Sub category not found" 
                    });

                // Check if subcategory has associated products
                if (subCategory.Products?.Any() == true)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Cannot delete sub category with associated products. Please move or delete products first." 
                    });
                }

                _db.SubCategories.Remove(subCategory);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Sub category deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting sub category", 
                    error = ex.Message 
                });
            }
        }
        #endregion


    }
}
