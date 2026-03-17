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
    public class DeliveryStaffAssignmentController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<DeliveryStaffAssignmentDto> _validator;
        public DeliveryStaffAssignmentController(SMDbContext db, IValidator<DeliveryStaffAssignmentDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Admin and Store Owners only)
        [HttpGet]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> GetAllDeliveryStaffAssignments()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                // Check role - allow Admin or StoreOwner
                var userRecord = await _db.Users.FindAsync(currentUserId);
                if (userRecord?.Role != "Admin" && userRecord?.Role != "StoreOwner")
                {
                    return Forbid();
                }

                var assignments = await _db.DeliveryStaffAssignments
                    .Include(dsa => dsa.DeliveryStaff)
                        .ThenInclude(ds => ds.User)
                    .Include(dsa => dsa.Order)
                        .ThenInclude(o => o.Customer)
                            .ThenInclude(c => c.User)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Delivery staff assignments retrieved successfully", 
                    data = assignments 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting delivery staff assignments", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get my (Delivery Staff only)
        [HttpGet("my")]
        [Authorize(Roles = "DeliveryStaff")]
        public async Task<IActionResult> GetMyAssignments()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var staff = await _db.DeliveryStaffs.FirstOrDefaultAsync(ds => ds.UserId == currentUserId);
                if (staff == null)
                {
                    var user = await _db.Users.FindAsync(currentUserId);
                    if (user == null || user.Role != "DeliveryStaff")
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Delivery staff profile not found and user is not delivery staff"
                        });
                    }

                    var defaultZone = await _db.Zones.FirstOrDefaultAsync(z => z.IsActive);
                    if (defaultZone == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "No active delivery zone configured"
                        });
                    }

                    staff = new DeliveryStaff
                    {
                        UserId = user.UserId,
                        ZoneId = defaultZone.ZoneId,
                        VehicleType = "Bike",
                        VehicleNumber = $"AUTO-{user.UserId}",
                        LicenseNumber = $"LIC-{user.UserId}",
                        Rating = 0,
                        CurrentLoad = 0,
                        MaxLoad = 5,
                        Status = "Available",
                        TotalDeliveriesCompleted = 0,
                        TotalEarnings = 0,
                        EmploymentStatus = "Active",
                        CreatedAt = DateTime.UtcNow,
                        ModifiedAt = DateTime.UtcNow
                    };

                    _db.DeliveryStaffs.Add(staff);
                    await _db.SaveChangesAsync();
                }

                var assignments = await _db.DeliveryStaffAssignments
                    .Include(dsa => dsa.DeliveryStaff)
                        .ThenInclude(ds => ds.User)
                    .Include(dsa => dsa.Order)
                        .ThenInclude(o => o.Customer)
                            .ThenInclude(c => c.User)
                    .Where(dsa => dsa.StaffId == staff.StaffId)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "My delivery assignments retrieved successfully", 
                    data = assignments 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting my assignments", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get by id (Role-based access)
        [HttpGet("{AssignmentId}")]
        public async Task<IActionResult> GetByIdDeliveryStaffAssignment(int AssignmentId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var assignment = await _db.DeliveryStaffAssignments
                    .Include(dsa => dsa.DeliveryStaff)
                        .ThenInclude(ds => ds.User)
                    .Include(dsa => dsa.Order)
                        .ThenInclude(o => o.Customer)
                            .ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(dsa => dsa.AssignmentId == AssignmentId);
                
                if (assignment == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Delivery staff assignment not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        hasAccess = true; // Store owners can view all assignments
                        break;
                    case "DeliveryStaff":
                        // Delivery staff can only view their own assignments
                        hasAccess = assignment.DeliveryStaff?.UserId == currentUserId;
                        break;
                    case "Customer":
                        // Customers can view assignments for their orders
                        hasAccess = assignment.Order?.Customer?.UserId == currentUserId;
                        break;
                    case "Admin":
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to view this assignment");

                return Ok(new { 
                    success = true, 
                    message = "Delivery staff assignment retrieved successfully", 
                    data = assignment 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting delivery staff assignment", 
                    error = ex.Message 
                });
            }
        }
        #endregion



        #region insert (Store Owners and Admins only)
        [HttpPost]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> InsertDeliveryStaffAssignment(DeliveryStaffAssignmentDto assignment)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                // Check role - allow Admin or StoreOwner
                var userRecord = await _db.Users.FindAsync(currentUserId);
                if (userRecord?.Role != "Admin" && userRecord?.Role != "StoreOwner")
                {
                    return Forbid();
                }

                var result = _validator.Validate(assignment);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Verify staff exists and is available
                var staff = await _db.DeliveryStaffs.FindAsync(assignment.StaffId);
                if (staff == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Delivery staff not found" 
                    });

                if (staff.Status != "Available")
                    return BadRequest(new { 
                        success = false, 
                        message = "Delivery staff is not available for assignment" 
                    });

                // Verify order exists
                var order = await _db.Orders.FindAsync(assignment.OrderId);
                if (order == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order not found" 
                    });

                // Check if order is already assigned
                var existingAssignment = await _db.DeliveryStaffAssignments
                    .FirstOrDefaultAsync(dsa => dsa.OrderId == assignment.OrderId && dsa.Status == "Active");
                if (existingAssignment != null)
                    return BadRequest(new { 
                        success = false, 
                        message = "Order is already assigned to another delivery staff" 
                    });

                var addAssignment = new DeliveryStaffAssignment
                {
                    StaffId = assignment.StaffId,
                    OrderId = assignment.OrderId,
                    AssignedDate = assignment.AssignedDate,
                    Status = assignment.Status ?? "Active",
                    Note = assignment.Note,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.DeliveryStaffAssignments.Add(addAssignment);

                // Update staff status to Busy
                staff.Status = "Busy";
                staff.ModifiedAt = DateTime.UtcNow;

                // Update order status to Processing
                order.Status = "Processing";
                order.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Delivery staff assignment created successfully", 
                    data = addAssignment 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating delivery staff assignment", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Store Owners and assigned Delivery Staff only)
        [HttpPut("{AssignmentId}")]
        public async Task<IActionResult> UpdateDeliveryStaffAssignment(int AssignmentId, DeliveryStaffAssignmentDto assignment)
        {
            if (AssignmentId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Assignment Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                assignment.AssignmentId = AssignmentId;
                var updateAssignment = await _db.DeliveryStaffAssignments
                    .Include(dsa => dsa.DeliveryStaff)
                    .FirstOrDefaultAsync(dsa => dsa.AssignmentId == AssignmentId);
                
                if (updateAssignment == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Delivery staff assignment not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        hasAccess = true; // Store owners can update any assignment
                        break;
                    case "DeliveryStaff":
                        // Delivery staff can only update their own assignments
                        hasAccess = updateAssignment.DeliveryStaff?.UserId == currentUserId;
                        break;
                    case "Admin":
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to update this assignment");

                updateAssignment.StaffId = assignment.StaffId;
                updateAssignment.OrderId = assignment.OrderId;
                updateAssignment.AssignedDate = assignment.AssignedDate;
                updateAssignment.Status = assignment.Status ?? updateAssignment.Status;
                updateAssignment.Note = assignment.Note;
                updateAssignment.ModifiedAt = DateTime.UtcNow;

                // Update related order and staff status if delivered
                if (updateAssignment.Status == "Delivered")
                {
                    var order = await _db.Orders.FindAsync(updateAssignment.OrderId);
                    if (order != null)
                    {
                        order.Status = "Delivered";
                        order.ModifiedAt = DateTime.UtcNow;
                    }

                    var staff = await _db.DeliveryStaffs.FindAsync(updateAssignment.StaffId);
                    if (staff != null)
                    {
                        staff.Status = "Available";
                        staff.ModifiedAt = DateTime.UtcNow;
                    }
                }
                else if (updateAssignment.Status == "In Transit")
                {
                    var order = await _db.Orders.FindAsync(updateAssignment.OrderId);
                    if (order != null)
                    {
                        order.Status = "In Transit";
                        order.ModifiedAt = DateTime.UtcNow;
                    }
                }

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Delivery staff assignment updated successfully", 
                    data = updateAssignment 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating delivery staff assignment", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners and Admins only)
        [HttpDelete("{AssignmentId}")]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> DeleteDeliveryStaffAssignment(int AssignmentId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                // Check role - allow Admin or StoreOwner
                var userRecord = await _db.Users.FindAsync(currentUserId);
                if (userRecord?.Role != "Admin" && userRecord?.Role != "StoreOwner")
                {
                    return Forbid();
                }

                var assignment = await _db.DeliveryStaffAssignments
                    .Include(dsa => dsa.DeliveryStaff)
                    .Include(dsa => dsa.Order)
                    .FirstOrDefaultAsync(dsa => dsa.AssignmentId == AssignmentId);
                
                if (assignment == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Delivery staff assignment not found" 
                    });

                // Update staff status back to Available if they were Busy
                if (assignment.DeliveryStaff != null && assignment.DeliveryStaff.Status == "Busy")
                {
                    assignment.DeliveryStaff.Status = "Available";
                    assignment.DeliveryStaff.ModifiedAt = DateTime.UtcNow;
                }

                // Update order status back to Pending
                if (assignment.Order != null)
                {
                    assignment.Order.Status = "Pending";
                    assignment.Order.ModifiedAt = DateTime.UtcNow;
                }

                _db.DeliveryStaffAssignments.Remove(assignment);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Delivery staff assignment deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting delivery staff assignment", 
                    error = ex.Message 
                });
            }
        }
        #endregion


    }
}
