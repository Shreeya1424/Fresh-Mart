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
    public class StoreOwnerController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<StoreOwnerDto> _validator;
        public StoreOwnerController(SMDbContext db, IValidator<StoreOwnerDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Store Owners and Admins only)
        [HttpGet]
        [Authorize(Roles = "StoreOwner")] // StoreOwner = admin
        public async Task<IActionResult> GetAllStoreOwners()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var storeOwners = await _db.StoreOwners
                    .Include(so => so.User)
                    .Include(so => so.Products)
                    .Include(so => so.StoreProfiles)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Store owners retrieved successfully", 
                    data = storeOwners 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting store owners", 
                    error = ex.Message 
                });
            }
        }
        #endregion



        #region get by id (Store Owner themselves only)
        [HttpGet("{StoreOwnerId}")]
        public async Task<IActionResult> GetByIdStoreOwner(int StoreOwnerId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var storeOwner = await _db.StoreOwners
                    .Include(so => so.User)
                    .Include(so => so.Products)
                    .Include(so => so.StoreProfiles)
                    .FirstOrDefaultAsync(so => so.StoreOwnerId == StoreOwnerId);
                
                if (storeOwner == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Store owner not found" 
                    });

                // StoreOwner = admin: any StoreOwner can view any store owner profile

                return Ok(new { 
                    success = true, 
                    message = "Store owner retrieved successfully", 
                    data = storeOwner 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting store owner", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Store Owners and Admins only)
        [HttpPost]
        [Authorize(Roles = "StoreOwner")] // StoreOwner = admin
        public async Task<IActionResult> InsertStoreOwner(StoreOwnerDto storeOwner)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var existingCount = await _db.StoreOwners.CountAsync();
                if (existingCount >= 1)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Only one store owner account is allowed in the system."
                    });
                }

                var result = _validator.Validate(storeOwner);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Verify user exists
                var user = await _db.Users.FindAsync(storeOwner.UserId);
                if (user == null)
                {
                    return NotFound(new { 
                        success = false, 
                        message = "User not found" 
                    });
                }

                var addStoreOwner = new StoreOwner
                {
                    UserId = storeOwner.UserId,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.StoreOwners.Add(addStoreOwner);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Store owner created successfully", 
                    data = addStoreOwner 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating store owner", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Store Owner themselves only)
        [HttpPut("{StoreOwnerId}")]
        public async Task<IActionResult> UpdateStoreOwner(int StoreOwnerId, StoreOwnerDto storeOwner)
        {
            if (StoreOwnerId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Store Owner Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                storeOwner.StoreOwnerId = StoreOwnerId;
                var updateStoreOwner = await _db.StoreOwners.FindAsync(StoreOwnerId);
                if (updateStoreOwner == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Store owner not found" 
                    });

                // StoreOwner = admin: any StoreOwner can update any store owner profile

                updateStoreOwner.UserId = storeOwner.UserId;
                updateStoreOwner.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Store owner updated successfully", 
                    data = updateStoreOwner 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating store owner", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners and Admins only)
        [HttpDelete("{StoreOwnerId}")]
        [Authorize(Roles = "StoreOwner")] // StoreOwner = admin
        public async Task<IActionResult> DeleteStoreOwner(int StoreOwnerId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var storeOwner = await _db.StoreOwners
                    .Include(so => so.Products)
                    .Include(so => so.StoreProfiles)
                    .FirstOrDefaultAsync(so => so.StoreOwnerId == StoreOwnerId);
                
                if (storeOwner == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Store owner not found" 
                    });

                // Check if store owner has active products
                if (storeOwner.Products?.Any(p => p.IsActive) == true)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Cannot delete store owner with active products. Please deactivate or delete products first." 
                    });
                }

                // Check if store owner has store profiles
                if (storeOwner.StoreProfiles?.Any() == true)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Cannot delete store owner with store profiles. Please delete store profiles first." 
                    });
                }

                _db.StoreOwners.Remove(storeOwner);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Store owner deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting store owner", 
                    error = ex.Message 
                });
            }
        }
        #endregion


    }
}
