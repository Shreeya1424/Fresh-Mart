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
    public class PaymentController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<PaymentDto> _validator;
        public PaymentController(SMDbContext db, IValidator<PaymentDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Store Owners only)
        [HttpGet]
        [Authorize(Roles = "StoreOwner")] // Only store owners can view all payments
        public async Task<IActionResult> GetAllPayments()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var payments = await _db.Payments
                    .Include(p => p.Order)
                        .ThenInclude(o => o.Customer)
                            .ThenInclude(c => c.User)
                    .ToListAsync();

                // Filter payments based on role
                if (currentUserRole == "Admin")
                {
                    // Admins can see all payments
                }
                else if (currentUserRole == "StoreOwner")
                {
                    // Store owners can only see payments for orders containing their products
                    var storeOwnerOrders = await _db.Orders
                        .Where(o => o.OrderItems.Any(oi => oi.Product.StoreOwner.UserId == currentUserId))
                        .Select(o => o.OrderId)
                        .ToListAsync();
                    
                    payments = payments.Where(p => storeOwnerOrders.Contains(p.OrderId)).ToList();
                }
                
                return Ok(new { 
                    success = true, 
                    message = "Payments retrieved successfully", 
                    data = payments 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting payments", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get by id (Role-based access)
        [HttpGet("{PaymentId}")]
        public async Task<IActionResult> GetByIdPayment(int PaymentId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var payment = await _db.Payments
                    .Include(p => p.Order)
                        .ThenInclude(o => o.Customer)
                            .ThenInclude(c => c.User)
                    .Include(p => p.Order)
                        .ThenInclude(o => o.OrderItems)
                            .ThenInclude(oi => oi.Product)
                                .ThenInclude(pr => pr.StoreOwner)
                    .FirstOrDefaultAsync(p => p.PaymentId == PaymentId);
                
                if (payment == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Payment not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        // Store owners can view payments for orders containing their products
                        hasAccess = payment.Order?.OrderItems?.Any(oi => oi.Product?.StoreOwner?.UserId == currentUserId) == true;
                        break;
                    case "Customer":
                        // Customers can view payments for their own orders
                        hasAccess = payment.Order?.Customer?.UserId == currentUserId;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to view this payment");

                return Ok(new { 
                    success = true, 
                    message = "Payment retrieved successfully", 
                    data = payment 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting payment", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Customers only - when making payments)
        [HttpPost]
        [Authorize(Roles = "Customer")] // Only customers can create payments
        public async Task<IActionResult> InsertPayment(PaymentDto payment)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var result = _validator.Validate(payment);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Verify order exists and belongs to current customer
                var order = await _db.Orders
                    .Include(o => o.Customer)
                    .FirstOrDefaultAsync(o => o.OrderId == payment.OrderId);
                
                if (order == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order not found" 
                    });

                if (order.Customer?.UserId != currentUserId)
                    return Forbid("You can only make payments for your own orders");

                // Check if payment already exists for this order
                var existingPayment = await _db.Payments.FirstOrDefaultAsync(p => p.OrderId == payment.OrderId);
                if (existingPayment != null)
                    return BadRequest(new { 
                        success = false, 
                        message = "Payment already exists for this order" 
                    });

                var addPayment = new Payment
                {
                    OrderId = payment.OrderId,
                    Status = payment.Status ?? "Pending",
                    AmountPaid = payment.AmountPaid,
                    TransactionId = payment.TransactionId,
                    PaymentMode = payment.PaymentMode,
                    PaymentDate = payment.PaymentDate ?? DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.Payments.Add(addPayment);
                
                if (payment.Status == "Completed" || payment.Status == "Success" || payment.Status == "Paid")
                {
                    order.Status = "Confirmed";
                    order.ModifiedAt = DateTime.UtcNow;
                }

                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Payment created successfully", 
                    data = addPayment 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating payment", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Customers can update their payments, Store Owners can update payment status)
        [HttpPut("{PaymentId}")]
        public async Task<IActionResult> UpdatePayment(int PaymentId, PaymentDto payment)
        {
            if (PaymentId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Payment Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                payment.PaymentId = PaymentId;
                var updatePayment = await _db.Payments
                    .Include(p => p.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(p => p.Order)
                        .ThenInclude(o => o.OrderItems)
                            .ThenInclude(oi => oi.Product)
                                .ThenInclude(pr => pr.StoreOwner)
                    .FirstOrDefaultAsync(p => p.PaymentId == PaymentId);
                
                if (updatePayment == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Payment not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        // Store owners can update payment status for orders containing their products
                        hasAccess = updatePayment.Order?.OrderItems?.Any(oi => oi.Product?.StoreOwner?.UserId == currentUserId) == true;
                        break;
                    case "Customer":
                        // Customers can update their own payments (limited fields)
                        hasAccess = updatePayment.Order?.Customer?.UserId == currentUserId;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to update this payment");

                // Update fields based on role
                if (currentUserRole == "Customer")
                {
                    // Customers can only update certain fields
                    updatePayment.PaymentMode = payment.PaymentMode;
                    updatePayment.TransactionId = payment.TransactionId;
                }
                else
                {
                    // Store owners can update all fields
                    updatePayment.Status = payment.Status;
                    updatePayment.AmountPaid = payment.AmountPaid;
                    updatePayment.TransactionId = payment.TransactionId;
                    updatePayment.PaymentMode = payment.PaymentMode;
                    updatePayment.PaymentDate = payment.PaymentDate ?? updatePayment.PaymentDate;
                }

                updatePayment.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Payment updated successfully", 
                    data = updatePayment 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating payment", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners only)
        [HttpDelete("{PaymentId}")]
        [Authorize(Roles = "StoreOwner")] // Only store owners can delete payments
        public async Task<IActionResult> DeletePayment(int PaymentId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var payment = await _db.Payments
                    .Include(p => p.Order)
                    .FirstOrDefaultAsync(p => p.PaymentId == PaymentId);
                
                if (payment == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Payment not found" 
                    });

                // Update order status back to pending if payment is deleted
                if (payment.Order != null)
                {
                    payment.Order.Status = "Pending";
                    payment.Order.ModifiedAt = DateTime.UtcNow;
                }

                _db.Payments.Remove(payment);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Payment deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting payment", 
                    error = ex.Message 
                });
            }
        }
        #endregion
    }
}
