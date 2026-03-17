using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMMS.Data;
using SMMS.Models;
using Microsoft.AspNetCore.Http;
using SMMS.Services;
using System;
using System.IO;
using System.Linq;

namespace SMMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class ProductController : BaseController
    {
        public class ProductImageUploadRequest
        {
            public IFormFile? Image { get; set; }
        }

        private readonly SMDbContext _db;
        public IValidator<ProductDto> _validator;
        private readonly IWebHostEnvironment _env;
        private readonly IFileService _fileService;

        public ProductController(SMDbContext db, IValidator<ProductDto> validator, IWebHostEnvironment env, IFileService fileService)
        {
            _db = db;
            _validator = validator;
            _env = env;
            _fileService = fileService;
        }

        #region GET All - Standard CRUD Method 1
        [HttpGet]
        [AllowAnonymous] // Allow anonymous access to view products
        public async Task<IActionResult> GetAllProducts(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? sortBy = "name",
            [FromQuery] string? sortOrder = "asc")
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;

                var query = _db.Products
                    .Include(p => p.Category)
                    .Include(p => p.SubCategory)
                    .Include(p => p.StoreOwner)
                    .Where(p => p.IsActive != false)
                    .AsQueryable();

                // Apply filtering
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(p => 
                        p.Name.Contains(searchTerm) || 
                        (p.Description != null && p.Description.Contains(searchTerm)) ||
                        (p.Brand != null && p.Brand.Contains(searchTerm)));
                }

                if (categoryId.HasValue && categoryId > 0)
                {
                    query = query.Where(p => p.CategoryId == categoryId.Value);
                }

                // Apply sorting
                if (!string.IsNullOrWhiteSpace(sortBy))
                {
                    bool isDesc = sortOrder?.ToLower() == "desc";
                    switch (sortBy.ToLower())
                    {
                        case "price":
                            query = isDesc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price);
                            break;
                        case "currentstock":
                        case "stock":
                            query = isDesc ? query.OrderByDescending(p => p.CurrentStock) : query.OrderBy(p => p.CurrentStock);
                            break;
                        case "name":
                        default:
                            query = isDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name);
                            break;
                    }
                }

                var totalCount = await query.CountAsync();
                var products = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new { 
                    success = true, 
                    message = "Products retrieved successfully", 
                    data = products,
                    pagination = new {
                        totalCount = totalCount,
                        pageSize = pageSize,
                        currentPage = page,
                        totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting products", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region GET By ID - Standard CRUD Method 2
        [HttpGet("{ProductId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByIdProduct(int ProductId)
        {
            try
            {
                var product = await _db.Products
                    .Include(p => p.Category)
                    .Include(p => p.SubCategory)
                    .Include(p => p.StoreOwner)
                    .FirstOrDefaultAsync(p => p.ProductId == ProductId);
                    
                if (product == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Product not found" 
                    });

                return Ok(new { 
                    success = true, 
                    message = "Product retrieved successfully", 
                    data = product 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting product", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region POST - Standard CRUD Method 3
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> InsertProduct([FromBody] ProductDto? product)
        {
            try
            {
                if (product == null)
                    return BadRequest(new { success = false, message = "Product data is required." });

                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var result = _validator.Validate(product);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // If user is Admin or StoreOwner, they must have a StoreOwner record
                var userRecord = await _db.Users.FindAsync(currentUserId);
                if (userRecord?.Role != "Admin" && userRecord?.Role != "StoreOwner")
                {
                    return Forbid("User is not a store owner or admin");
                }

                var storeOwner = await _db.StoreOwners
                    .FirstOrDefaultAsync(so => so.UserId == currentUserId);
                
                int storeOwnerId = 0;
                if (storeOwner != null)
                {
                    storeOwnerId = storeOwner.StoreOwnerId;
                }
                else
                {
                    // Create a StoreOwner record for the current user (Admin or StoreOwner role)
                    var newStoreOwner = new StoreOwner
                    {
                        UserId = currentUserId.Value,
                        CreatedAt = DateTime.UtcNow,
                        ModifiedAt = DateTime.UtcNow
                    };
                    _db.StoreOwners.Add(newStoreOwner);
                    await _db.SaveChangesAsync();
                    storeOwnerId = newStoreOwner.StoreOwnerId;
                }

                var imageUrl = !string.IsNullOrWhiteSpace(product.ImageUrl) ? product.ImageUrl : "/uploads/products/placeholder.png";
                var addProduct = new Product
                {
                    Name = product.Name ?? "",
                    Brand = product.Brand,
                    CategoryId = product.CategoryId,
                    Price = product.Price,
                    Description = product.Description,
                    IsFeatured = product.IsFeatured,
                    ImageUrl = imageUrl,
                    CurrentStock = product.CurrentStock,
                    LowStockValue = product.LowStockValue,
                    IsActive = product.IsActive,
                    StoreOwnerId = storeOwnerId,
                    SubCategoryId = product.SubCategoryId,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.Products.Add(addProduct);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Product created successfully", 
                    data = addProduct 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating product", 
                    error = ex.ToString() 
                });
            }
        }
        #endregion

        #region POST - Upload Product Image
        [HttpPost("{ProductId}/image")]
        [Consumes("multipart/form-data")]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> UploadProductImage(int ProductId, [FromForm] ProductImageUploadRequest request)
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

                var image = request.Image;
                if (image == null || image.Length == 0)
                    return BadRequest(new { success = false, message = "No image file provided" });

                // Basic content-type check (allow common images)
                var allowed = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
                if (!allowed.Contains(image.ContentType))
                    return BadRequest(new { success = false, message = "Unsupported image type" });

                var product = await _db.Products.FindAsync(ProductId);
                if (product == null)
                    return NotFound(new { success = false, message = "Product not found" });

                // StoreOwner = admin: can upload for any product (no ownership check)

                var relativePath = await _fileService.UploadFileAsync(image, "products");
                var publicUrl = $"{Request.Scheme}://{Request.Host}/{relativePath}";

                product.ImageUrl = publicUrl;
                product.ModifiedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Product image uploaded successfully",
                    imageUrl = publicUrl,
                    data = product
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error uploading product image",
                    error = ex.Message
                });
            }
        }
        #endregion

        #region PUT - Standard CRUD Method 4
        [HttpPut("{ProductId}")]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> UpdateProduct(int ProductId, ProductDto product)
        {
            if (ProductId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid product ID" 
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

                var updateProduct = await _db.Products.FindAsync(ProductId);
                if (updateProduct == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Product not found" 
                    });

                // StoreOwner = admin: can update any product (no ownership check)

                updateProduct.Name = product.Name ?? "";
                updateProduct.Brand = product.Brand;
                updateProduct.CategoryId = product.CategoryId;
                updateProduct.Price = product.Price;
                updateProduct.Description = product.Description;
                updateProduct.IsFeatured = product.IsFeatured;
                updateProduct.ImageUrl = product.ImageUrl ?? "";
                updateProduct.CurrentStock = product.CurrentStock;
                updateProduct.LowStockValue = product.LowStockValue;
                updateProduct.IsActive = product.IsActive;
                updateProduct.SubCategoryId = product.SubCategoryId;
                updateProduct.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Product updated successfully", 
                    data = updateProduct 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating product", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region DELETE - Standard CRUD Method 5
        [HttpDelete("{ProductId}")]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> DeleteProduct(int ProductId)
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

                var product = await _db.Products.FindAsync(ProductId);
                if (product == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Product not found" 
                    });

                // StoreOwner = admin: can delete any product (no ownership check)
                _fileService.DeleteFile(product.ImageUrl?.Replace($"{Request.Scheme}://{Request.Host}/", ""));

                _db.Products.Remove(product);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Product deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting product", 
                    error = ex.Message 
                });
            }
        }
        #endregion
    }
}
