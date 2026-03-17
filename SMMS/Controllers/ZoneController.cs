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
    public class ZoneController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<ZoneDto> _validator;
        public ZoneController(SMDbContext db, IValidator<ZoneDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Public access for customers to view delivery zones)
        [HttpGet]
        [AllowAnonymous] // Allow public access to view zones
        public async Task<IActionResult> GetAllZones()
        {
            try
            {
                var zones = await _db.Zones.Where(z => z.IsActive).ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Zones retrieved successfully", 
                    data = zones 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting zones", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get by id (Public access for customers to view zone details)
        [HttpGet("{ZoneId}")]
        [AllowAnonymous] // Allow public access to view individual zones
        public async Task<IActionResult> GetByIdZone(int ZoneId)
        {
            try
            {
                var zone = await _db.Zones.FindAsync(ZoneId);
                if (zone == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Zone not found" 
                    });

                return Ok(new { 
                    success = true, 
                    message = "Zone retrieved successfully", 
                    data = zone 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting zone", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Store Owners and Customers)
        [HttpPost]
        public async Task<IActionResult> InsertZone(ZoneDto zone)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var currentUserRole = GetCurrentUserRole();
                if (currentUserRole != "StoreOwner" && currentUserRole != "Customer" && currentUserRole != "Admin")
                {
                    return Forbid("You do not have permission to create zones");
                }

                var result = _validator.Validate(zone);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Check if zone with same pincode already exists
                var existingZone = await _db.Zones.FirstOrDefaultAsync(z => z.PincodeNumber == zone.PincodeNumber);
                if (existingZone != null)
                    return BadRequest(new { 
                        success = false, 
                        message = "Zone with this pincode already exists" 
                    });

                var addZone = new Zone
                {
                    ZoneName = zone.ZoneName,
                    Description = zone.Description,
                    PincodeNumber = zone.PincodeNumber,
                    City = zone.City,
                    State = zone.State,
                    Country = zone.Country,
                    IsActive = zone.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.Zones.Add(addZone);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Zone created successfully", 
                    data = addZone 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating zone", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Store Owners only)
        [HttpPut("{ZoneId}")]
        [Authorize(Roles = "StoreOwner")] // Only store owners can update zones
        public async Task<IActionResult> UpdateZone(int ZoneId, ZoneDto zone)
        {
            if (ZoneId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Zone Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                zone.ZoneId = ZoneId;

                var updateZone = await _db.Zones.FindAsync(ZoneId);
                if (updateZone == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Zone not found" 
                    });

                // Check if pincode is already taken by another zone
                var existingZone = await _db.Zones.FirstOrDefaultAsync(z => z.ZoneId != ZoneId && z.PincodeNumber == zone.PincodeNumber);
                if (existingZone != null)
                    return BadRequest(new { 
                        success = false, 
                        message = "Another zone with this pincode already exists" 
                    });

                updateZone.ZoneName = zone.ZoneName;
                updateZone.Description = zone.Description;
                updateZone.PincodeNumber = zone.PincodeNumber;
                updateZone.City = zone.City;
                updateZone.State = zone.State;
                updateZone.Country = zone.Country;
                updateZone.IsActive = zone.IsActive;
                updateZone.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Zone updated successfully",
                    data = updateZone
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating zone", 
                    error = ex.Message 
                });
            }
        }
        #endregion


        #region delete (Store Owners only)
        [HttpDelete("{ZoneId}")]
        [Authorize(Roles = "StoreOwner")] // Only store owners can delete zones
        public async Task<IActionResult> DeleteZone(int ZoneId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var zone = await _db.Zones.FindAsync(ZoneId);
                if (zone == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Zone not found" 
                    });

                // Check if zone is being used by any customers
                var isZoneInUse = await _db.Customers.AnyAsync(c => c.Address.Contains(zone.PincodeNumber.ToString()));

                if (isZoneInUse)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Cannot delete zone as it is currently in use by customers" 
                    });
                }

                _db.Zones.Remove(zone);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Zone deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting zone", 
                    error = ex.Message 
                });
            }
        }
        #endregion
    }
}
