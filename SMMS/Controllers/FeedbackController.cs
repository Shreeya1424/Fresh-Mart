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
    public class FeedbackController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<FeedbackDto> _validator;
        public FeedbackController(SMDbContext db, IValidator<FeedbackDto> validator)
        {
            _db = db;
            _validator = validator;
        }
        #region get all (Store Owners can view feedback for their products)
        [HttpGet]
        [Authorize(Roles = "StoreOwner")] // StoreOwner = admin
        public async Task<IActionResult> GetAllFeedbacks()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var feedbacks = await _db.Feedbacks
                    .Include(f => f.User)
                    .Include(f => f.Order)
                    .Include(f => f.Product)
                        .ThenInclude(p => p.StoreOwner)
                    .ToListAsync();

                // Filter feedbacks based on role
                if (currentUserRole == "StoreOwner")
                {
                    // Store owners can only see feedback for their products
                    feedbacks = feedbacks.Where(f => f.Product?.StoreOwner?.UserId == currentUserId).ToList();
                }
                
                return Ok(new { 
                    success = true, 
                    message = "Feedbacks retrieved successfully", 
                    data = feedbacks 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting feedbacks", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get by id (Role-based access)
        [HttpGet("{FeedbackId}")]
        public async Task<IActionResult> GetByIdFeedback(int FeedbackId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var feedback = await _db.Feedbacks
                    .Include(f => f.User)
                    .Include(f => f.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(f => f.Product)
                        .ThenInclude(p => p.StoreOwner)
                    .FirstOrDefaultAsync(f => f.FeedbackId == FeedbackId);
                
                if (feedback == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Feedback not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        // Store owners can view feedback for their products
                        hasAccess = feedback.Product?.StoreOwner?.UserId == currentUserId;
                        break;
                    case "Customer":
                        // Customers can view their own feedback
                        hasAccess = feedback.UserId == currentUserId;
                        break;
                    case "Admin":
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to view this feedback");

                return Ok(new { 
                    success = true, 
                    message = "Feedback retrieved successfully", 
                    data = feedback 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting feedback", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Customers only)
        [HttpPost]
        [Authorize(Roles = "Customer")] // Only customers can create feedback
        public async Task<IActionResult> InsertFeedback(FeedbackDto feedback)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var result = _validator.Validate(feedback);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Verify the customer can give feedback (must have ordered the product)
                if (feedback.OrderId.HasValue && feedback.ProductId.HasValue)
                {
                    var orderItem = await _db.OrderItems
                        .Include(oi => oi.Order)
                            .ThenInclude(o => o.Customer)
                        .FirstOrDefaultAsync(oi => oi.OrderId == feedback.OrderId && 
                                                  oi.ProductId == feedback.ProductId);
                    
                    if (orderItem == null || orderItem.Order?.Customer?.UserId != currentUserId)
                        return BadRequest(new { 
                            success = false, 
                            message = "You can only provide feedback for products you have ordered" 
                        });

                    // Check if order is delivered
                    if (orderItem.Order?.Status != "Delivered")
                        return BadRequest(new { 
                            success = false, 
                            message = "You can only provide feedback after the order is delivered" 
                        });
                }

                var addFeedback = new Feedback
                {
                    UserId = currentUserId.Value,
                    OrderId = feedback.OrderId,
                    ProductId = feedback.ProductId,
                    Rating = feedback.Rating,
                    Comment = feedback.Comment,
                    FeedbackTargetType = feedback.FeedbackTargetType,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.Feedbacks.Add(addFeedback);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Feedback created successfully", 
                    data = addFeedback 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating feedback", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Customers can update their own feedback)
        [HttpPut("{FeedbackId}")]
        public async Task<IActionResult> UpdateFeedback(int FeedbackId, FeedbackDto feedback)
        {
            if (FeedbackId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Feedback Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                feedback.FeedbackId = FeedbackId;
                var updateFeedback = await _db.Feedbacks.FindAsync(FeedbackId);
                if (updateFeedback == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Feedback not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "Customer":
                        // Customers can only update their own feedback
                        hasAccess = updateFeedback.UserId == currentUserId;
                        break;
                    case "Admin":
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to update this feedback");

                updateFeedback.Rating = feedback.Rating;
                updateFeedback.Comment = feedback.Comment;
                updateFeedback.FeedbackTargetType = feedback.FeedbackTargetType;
                updateFeedback.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Feedback updated successfully", 
                    data = updateFeedback 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating feedback", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Customers can delete their own feedback, Admins can delete any)
        [HttpDelete("{FeedbackId}")]
        public async Task<IActionResult> DeleteFeedback(int FeedbackId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var feedback = await _db.Feedbacks.FindAsync(FeedbackId);
                if (feedback == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Feedback not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "Customer":
                        // Customers can only delete their own feedback
                        hasAccess = feedback.UserId == currentUserId;
                        break;
                    case "Admin":
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to delete this feedback");

                _db.Feedbacks.Remove(feedback);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Feedback deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting feedback", 
                    error = ex.Message 
                });
            }
        }
        #endregion
    }
}
