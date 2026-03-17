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
    public class DeliveryStaffController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;
        public IValidator<DeliveryStaffDTO> _validator;
        
        public DeliveryStaffController(SMDbContext db, IValidator<DeliveryStaffDTO> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region GET All - Standard CRUD Method 1
        [HttpGet]
        [Authorize(Roles = "StoreOwner")] // Only store owners can view all delivery staff
        public async Task<IActionResult> GetAllDeliveryStaff()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var staffList = await _db.DeliveryStaffs
                    .Include(ds => ds.User)
                    .Include(ds => ds.Zone)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Delivery staff retrieved successfully", 
                    data = staffList 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting delivery staff", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region GET My Profile (DeliveryStaff only)
        [HttpGet("my")]
        [Authorize(Roles = "DeliveryStaff")]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var staff = await _db.DeliveryStaffs
                    .Include(ds => ds.User)
                    .Include(ds => ds.Zone)
                    .FirstOrDefaultAsync(ds => ds.UserId == currentUserId);

                if (staff != null)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Delivery staff profile retrieved successfully",
                        data = staff
                    });
                }

                var user = await _db.Users.FindAsync(currentUserId.Value);
                if (user == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "User not found for current delivery staff"
                    });
                }

                var fallbackProfile = new
                {
                    StaffId = 0,
                    UserId = user.UserId,
                    ZoneId = (int?)null,
                    Zone = (Zone?)null,
                    VehicleType = string.Empty,
                    VehicleNumber = string.Empty,
                    LicenseNumber = string.Empty,
                    Rating = 0d,
                    CurrentLoad = 0,
                    MaxLoad = 5,
                    Status = "Available",
                    TotalDeliveriesCompleted = 0,
                    TotalEarnings = 0m,
                    EmploymentStatus = "Active",
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = (DateTime?)null,
                    User = user
                };

                return Ok(new
                {
                    success = true,
                    message = "Delivery staff profile not fully configured; showing basic user info",
                    data = fallbackProfile
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error getting delivery staff profile",
                    error = ex.Message
                });
            }
        }
        #endregion

        #region GET By ID - Standard CRUD Method 2
        [HttpGet("{StaffId:int}")]
        public async Task<IActionResult> GetByIdDeliveryStaff(int StaffId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var staff = await _db.DeliveryStaffs
                    .Include(ds => ds.User)
                    .Include(ds => ds.Zone)
                    .FirstOrDefaultAsync(ds => ds.StaffId == StaffId);
                
                if (staff == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Delivery staff not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        hasAccess = true; // Store owners can view any staff
                        break;
                    case "DeliveryStaff":
                        hasAccess = staff.UserId == currentUserId; // Staff can only view their own profile
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to view this delivery staff profile");

                return Ok(new { 
                    success = true, 
                    message = "Delivery staff retrieved successfully", 
                    data = staff 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting delivery staff", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region POST - Standard CRUD Method 3
        [HttpPost]
        [Authorize(Roles = "StoreOwner")] // Only store owners can add delivery staff
        public async Task<IActionResult> InsertDeliveryStaff(DeliveryStaffDTO staff)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var result = _validator.Validate(staff);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Check if user exists and is not already a delivery staff
                var existingStaff = await _db.DeliveryStaffs.FirstOrDefaultAsync(ds => ds.UserId == staff.UserId);
                if (existingStaff != null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "User is already registered as delivery staff" 
                    });
                }

                var addStaff = new DeliveryStaff
                {
                    UserId = staff.UserId,
                    ZoneId = staff.ZoneId,
                    VehicleType = staff.VehicleType,
                    VehicleNumber = staff.VehicleNumber,
                    LicenseNumber = staff.LicenseNumber,
                    MaxLoad = staff.MaxLoad,
                    Status = staff.Status ?? "Available",
                    TotalDeliveriesCompleted = 0,
                    TotalEarnings = 0,
                    EmploymentStatus = staff.EmploymentStatus ?? "Active",
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.DeliveryStaffs.Add(addStaff);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Delivery staff created successfully", 
                    data = addStaff 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating delivery staff", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region PUT - Standard CRUD Method 4
        [HttpPut("{StaffId}")]
        public async Task<IActionResult> UpdateDeliveryStaff(int StaffId, DeliveryStaffDTO staff)
        {
            if (StaffId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid staff ID" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var updateStaff = await _db.DeliveryStaffs.FindAsync(StaffId);
                if (updateStaff == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Delivery staff not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        hasAccess = true; // Store owners can update any staff
                        break;
                    case "DeliveryStaff":
                        hasAccess = updateStaff.UserId == currentUserId; // Staff can only update their own profile
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to update this delivery staff profile");

                // Update fields
                updateStaff.ZoneId = staff.ZoneId;
                updateStaff.VehicleType = staff.VehicleType;
                updateStaff.VehicleNumber = staff.VehicleNumber;
                updateStaff.LicenseNumber = staff.LicenseNumber;
                updateStaff.MaxLoad = staff.MaxLoad;
                updateStaff.Status = staff.Status;
                updateStaff.TotalDeliveriesCompleted = staff.TotalDeliveriesCompleted;
                updateStaff.TotalEarnings = staff.TotalEarnings;
                updateStaff.EmploymentStatus = staff.EmploymentStatus;
                updateStaff.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Delivery staff updated successfully", 
                    data = updateStaff 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating delivery staff", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region PUT My Profile (DeliveryStaff only)
        [HttpPut("my")]
        [Authorize(Roles = "DeliveryStaff")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] DeliveryStaffProfileUpdateDto profile)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                if (string.IsNullOrWhiteSpace(profile.UserName) ||
                    string.IsNullOrWhiteSpace(profile.Email) ||
                    string.IsNullOrWhiteSpace(profile.Phone))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Name, email and phone are required"
                    });
                }

                var staff = await _db.DeliveryStaffs
                    .Include(ds => ds.User)
                    .FirstOrDefaultAsync(ds => ds.UserId == currentUserId);

                if (staff == null)
                {
                    var user = await _db.Users.FindAsync(currentUserId.Value);
                    if (user == null)
                    {
                        return NotFound(new
                        {
                            success = false,
                            message = "User not found for current delivery staff"
                        });
                    }

                    var defaultZoneId = await _db.Zones
                        .OrderBy(z => z.ZoneId)
                        .Select(z => z.ZoneId)
                        .FirstOrDefaultAsync();

                    staff = new DeliveryStaff
                    {
                        UserId = user.UserId,
                        ZoneId = defaultZoneId == 0 ? 1 : defaultZoneId,
                        VehicleType = string.IsNullOrWhiteSpace(profile.VehicleType) ? "Bike" : profile.VehicleType,
                        VehicleNumber = string.IsNullOrWhiteSpace(profile.VehicleNumber) ? "UNKNOWN" : profile.VehicleNumber,
                        LicenseNumber = string.IsNullOrWhiteSpace(profile.LicenseNumber) ? "UNKNOWN" : profile.LicenseNumber,
                        Rating = 0,
                        CurrentLoad = 0,
                        MaxLoad = 5,
                        Status = "Available",
                        TotalDeliveriesCompleted = 0,
                        TotalEarnings = 0,
                        EmploymentStatus = "Active",
                        CreatedAt = DateTime.UtcNow,
                        ModifiedAt = DateTime.UtcNow,
                        User = user
                    };

                    _db.DeliveryStaffs.Add(staff);
                }

                staff.User.UserName = profile.UserName;
                staff.User.Email = profile.Email;
                staff.User.Phone = profile.Phone;

                if (!string.IsNullOrWhiteSpace(profile.VehicleType))
                    staff.VehicleType = profile.VehicleType;
                if (!string.IsNullOrWhiteSpace(profile.VehicleNumber))
                    staff.VehicleNumber = profile.VehicleNumber;
                if (!string.IsNullOrWhiteSpace(profile.LicenseNumber))
                    staff.LicenseNumber = profile.LicenseNumber;

                staff.ModifiedAt = DateTime.UtcNow;
                staff.User.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Delivery staff profile updated successfully",
                    data = staff
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error updating delivery staff profile",
                    error = ex.Message
                });
            }
        }
        #endregion

        #region DELETE - Standard CRUD Method 5
        [HttpDelete("{StaffId}")]
        [Authorize(Roles = "StoreOwner")] // Only store owners can delete delivery staff
        public async Task<IActionResult> DeleteDeliveryStaff(int StaffId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var staff = await _db.DeliveryStaffs.Include(ds => ds.User).FirstOrDefaultAsync(ds => ds.StaffId == StaffId);
                if (staff == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Delivery staff not found" 
                    });

                // Delete all assignments related to this staff first (past and current)
                // This is to satisfy college project requirements of forcing single staff member
                var assignments = await _db.DeliveryStaffAssignments
                    .Where(dsa => dsa.StaffId == StaffId)
                    .ToListAsync();
                
                if (assignments.Any())
                {
                    _db.DeliveryStaffAssignments.RemoveRange(assignments);
                }

                // Get the user record to delete as well
                var user = staff.User;

                // Remove staff record
                _db.DeliveryStaffs.Remove(staff);

                // Try to delete the user record if it's not the current user
                // We use a separate try-catch because the user might have other roles (like StoreOwner in seed data)
                // which would prevent deletion due to foreign key constraints.
                if (user != null && user.UserId != currentUserId)
                {
                    try
                    {
                        // Check if user has other roles before attempting deletion
                        bool hasOtherRoles = await _db.StoreOwners.AnyAsync(so => so.UserId == user.UserId) || 
                                           await _db.Customers.AnyAsync(c => c.UserId == user.UserId);
                        
                        if (!hasOtherRoles)
                        {
                            _db.Users.Remove(user);
                        }
                        else
                        {
                            // If they have other roles, just change their role from DeliveryStaff to something else if needed
                            // or just leave it as is since the DeliveryStaff record is already being removed.
                            user.Role = "Customer"; // Fallback role
                            _db.Entry(user).State = EntityState.Modified;
                        }
                    }
                    catch (Exception userEx)
                    {
                        // Log and ignore user deletion errors to ensure the staff record is at least removed
                        Console.WriteLine($"Could not delete user record: {userEx.Message}");
                    }
                }

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Delivery staff and associated data deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting delivery staff", 
                    error = ex.Message 
                });
            }
        }
        #endregion
    }
}
