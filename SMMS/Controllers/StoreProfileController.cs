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
    public class StoreProfileController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<StoreProfileDto> _validator;
        public StoreProfileController(SMDbContext db, IValidator<StoreProfileDto> validator)
        {
            _db = db;
            _validator = validator;
        }


        #region get all (Public access for customers to view stores)
        [HttpGet]
        [AllowAnonymous] // Allow public access to view store profiles
        public async Task<IActionResult> GetAllStoreProfiles()
        {
            try
            {
                var storeProfiles = await _db.StoreProfiles
                    .Include(sp => sp.Owner)
                        .ThenInclude(so => so.User)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Store profiles retrieved successfully", 
                    data = storeProfiles 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting store profiles", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get by id (Public access for customers to view store details)
        [HttpGet("{StoreId}")]
        [AllowAnonymous] // Allow public access to view individual store profiles
        public async Task<IActionResult> GetByIdStoreProfile(int StoreId)
        {
            try
            {
                var storeProfile = await _db.StoreProfiles
                    .Include(sp => sp.Owner)
                        .ThenInclude(so => so.User)
                    .FirstOrDefaultAsync(sp => sp.StoreId == StoreId);
                
                if (storeProfile == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Store profile not found" 
                    });

                return Ok(new { 
                    success = true, 
                    message = "Store profile retrieved successfully", 
                    data = storeProfile 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting store profile", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Store Owners only)
        [HttpPost]
        [Authorize(Roles = "StoreOwner")] // Only store owners can create store profiles
        public async Task<IActionResult> InsertStoreProfile(StoreProfileDto storeProfile)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var result = _validator.Validate(storeProfile);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Get the store owner record for the current user
                var storeOwner = await _db.StoreOwners.FirstOrDefaultAsync(so => so.UserId == currentUserId);
                if (storeOwner == null)
                    return BadRequest(new { 
                        success = false, 
                        message = "You must be registered as a store owner to create a store profile" 
                    });

                // Check if store owner already has a profile
                var existingProfile = await _db.StoreProfiles.FirstOrDefaultAsync(sp => sp.OwnerId == storeOwner.StoreOwnerId);
                if (existingProfile != null)
                    return BadRequest(new { 
                        success = false, 
                        message = "Store profile already exists for this store owner" 
                    });

                var addStoreProfile = new StoreProfile
                {
                    StoreName = storeProfile.StoreName,
                    OwnerId = storeOwner.StoreOwnerId, // Use the current user's store owner ID
                    Address = storeProfile.Address,
                    Phone = storeProfile.Phone,
                    Email = storeProfile.Email,
                    Description = storeProfile.Description,
                    DeliveryRadiusKm = storeProfile.DeliveryRadiusKm,
                    OpeningTime = storeProfile.OpeningTime,
                    ClosingTime = storeProfile.ClosingTime,
                    Gstnumber = storeProfile.Gstnumber,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.StoreProfiles.Add(addStoreProfile);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Store profile created successfully", 
                    data = addStoreProfile 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating store profile", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Store Owners can update their own profile)
        [HttpPut("{StoreId}")]
        public async Task<IActionResult> UpdateStoreProfile(int StoreId, StoreProfileDto storeProfile)
        {
            if (StoreId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Store Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                storeProfile.StoreId = StoreId;
                var updateStoreProfile = await _db.StoreProfiles
                    .Include(sp => sp.Owner)
                    .FirstOrDefaultAsync(sp => sp.StoreId == StoreId);
                
                if (updateStoreProfile == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Store profile not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        // Store owners can only update their own profile
                        hasAccess = updateStoreProfile.Owner?.UserId == currentUserId;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to update this store profile");

                updateStoreProfile.StoreName = storeProfile.StoreName;
                updateStoreProfile.Address = storeProfile.Address;
                updateStoreProfile.Phone = storeProfile.Phone;
                updateStoreProfile.Email = storeProfile.Email;
                updateStoreProfile.Description = storeProfile.Description;
                updateStoreProfile.DeliveryRadiusKm = storeProfile.DeliveryRadiusKm;
                updateStoreProfile.OpeningTime = storeProfile.OpeningTime;
                updateStoreProfile.ClosingTime = storeProfile.ClosingTime;
                updateStoreProfile.Gstnumber = storeProfile.Gstnumber;
                updateStoreProfile.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Store profile updated successfully", 
                    data = updateStoreProfile 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating store profile", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners only)
        [HttpDelete("{StoreId}")]
        public async Task<IActionResult> DeleteStoreProfile(int StoreId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var storeProfile = await _db.StoreProfiles
                    .Include(sp => sp.Owner)
                    .FirstOrDefaultAsync(sp => sp.StoreId == StoreId);
                
                if (storeProfile == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Store profile not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        // Store owners can only delete their own profile
                        hasAccess = storeProfile.Owner?.UserId == currentUserId;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to delete this store profile");

                _db.StoreProfiles.Remove(storeProfile);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Store profile deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting store profile", 
                    error = ex.Message 
                });
            }
        }
        #endregion
    }
}
