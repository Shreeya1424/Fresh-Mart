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
    public class OrderTrackingHistoryController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<OrderTrackingHistoryDto> _validator;
        public OrderTrackingHistoryController(SMDbContext db, IValidator<OrderTrackingHistoryDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Store Owners and Delivery Staff only)
        [HttpGet]
        [Authorize(Roles = "StoreOwner,DeliveryStaff")] // Only store owners and delivery staff can view all tracking histories
        public async Task<IActionResult> GetAllOrderTrackingHistories()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var histories = await _db.OrderTrackingHistories
                    .Include(oth => oth.Order)
                        .ThenInclude(o => o.Customer)
                            .ThenInclude(c => c.User)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Order tracking histories retrieved successfully", 
                    data = histories 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting order tracking histories", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get by id (Role-based access)
        [HttpGet("{TrackingId}")]
        public async Task<IActionResult> GetByIdOrderTrackingHistory(int TrackingId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var history = await _db.OrderTrackingHistories
                    .Include(oth => oth.Order)
                        .ThenInclude(o => o.Customer)
                            .ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(oth => oth.TrackingId == TrackingId);
                
                if (history == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order tracking history not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        hasAccess = true; // Store owners can view all tracking histories
                        break;
                    case "DeliveryStaff":
                        hasAccess = true; // Delivery staff can view all tracking histories
                        break;
                    case "Customer":
                        // Customers can only view tracking for their own orders
                        hasAccess = history.Order?.Customer?.UserId == currentUserId;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to view this tracking history");

                return Ok(new { 
                    success = true, 
                    message = "Order tracking history retrieved successfully", 
                    data = history 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting order tracking history", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Store Owners and Delivery Staff only)
        [HttpPost]
        [Authorize(Roles = "StoreOwner,DeliveryStaff")] // Only store owners and delivery staff can create tracking histories
        public async Task<IActionResult> InsertOrderTrackingHistory(OrderTrackingHistoryDto history)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var result = _validator.Validate(history);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Verify order exists
                var order = await _db.Orders.FindAsync(history.OrderId);
                if (order == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order not found" 
                    });

                var addHistory = new OrderTrackingHistory
                {
                    OrderId = history.OrderId,
                    Status = history.Status,
                    StatusTime = history.StatusTime,
                    Location = history.Location,
                    Note = history.Note,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.OrderTrackingHistories.Add(addHistory);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Order tracking history created successfully", 
                    data = addHistory 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating order tracking history", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Store Owners and Delivery Staff only)
        [HttpPut("{TrackingId}")]
        [Authorize(Roles = "StoreOwner,DeliveryStaff")] // Only store owners and delivery staff can update tracking histories
        public async Task<IActionResult> UpdateOrderTrackingHistory(int TrackingId, OrderTrackingHistoryDto history)
        {
            if (TrackingId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Tracking Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                history.TrackingId = TrackingId;
                var updateHistory = await _db.OrderTrackingHistories.FindAsync(TrackingId);
                if (updateHistory == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order tracking history not found" 
                    });

                updateHistory.OrderId = history.OrderId;
                updateHistory.Status = history.Status;
                updateHistory.StatusTime = history.StatusTime;
                updateHistory.Location = history.Location;
                updateHistory.Note = history.Note;
                updateHistory.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Order tracking history updated successfully", 
                    data = updateHistory 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating order tracking history", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners only)
        [HttpDelete("{TrackingId}")]
        [Authorize(Roles = "StoreOwner")] // Only store owners can delete tracking histories
        public async Task<IActionResult> DeleteOrderTrackingHistory(int TrackingId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var history = await _db.OrderTrackingHistories.FindAsync(TrackingId);
                if (history == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order tracking history not found" 
                    });

                _db.OrderTrackingHistories.Remove(history);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Order tracking history deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting order tracking history", 
                    error = ex.Message 
                });
            }
        }
        #endregion
    }
}
