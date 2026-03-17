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
    public class OrderItemController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<OrderItemDto> _validator;
        public OrderItemController(SMDbContext db, IValidator<OrderItemDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Store Owners only)
        [HttpGet]
        [Authorize(Roles = "StoreOwner")] // Only store owners can view all order items
        public async Task<IActionResult> GetAllOrderItems()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var orderItems = await _db.OrderItems
                    .Include(oi => oi.Order)
                        .ThenInclude(o => o.Customer)
                            .ThenInclude(c => c.User)
                    .Include(oi => oi.Product)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Order items retrieved successfully", 
                    data = orderItems 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting order items", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get by id (Role-based access)
        [HttpGet("{OrderItemId}")]
        public async Task<IActionResult> GetByIdOrderItem(int OrderItemId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var orderItem = await _db.OrderItems
                    .Include(oi => oi.Order)
                        .ThenInclude(o => o.Customer)
                            .ThenInclude(c => c.User)
                    .Include(oi => oi.Product)
                        .ThenInclude(p => p.StoreOwner)
                    .FirstOrDefaultAsync(oi => oi.OrderItemId == OrderItemId);
                
                if (orderItem == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order item not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        // Store owners can view order items for their products
                        hasAccess = orderItem.Product?.StoreOwner?.UserId == currentUserId;
                        break;
                    case "Customer":
                        // Customers can view order items from their orders
                        hasAccess = orderItem.Order?.Customer?.UserId == currentUserId;
                        break;
                    case "DeliveryStaff":
                        // Delivery staff can view order items for orders assigned to them
                        var isAssigned = await _db.DeliveryStaffAssignments
                            .Include(dsa => dsa.DeliveryStaff)
                            .AnyAsync(dsa => dsa.OrderId == orderItem.OrderId && 
                                           dsa.DeliveryStaff.UserId == currentUserId && 
                                           dsa.Status == "Active");
                        hasAccess = isAssigned;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to view this order item");

                return Ok(new { 
                    success = true, 
                    message = "Order item retrieved successfully", 
                    data = orderItem 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting order item", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Customers only - when placing orders)
        [HttpPost]
        [Authorize(Roles = "Customer")] // Only customers can create order items when placing orders
        public async Task<IActionResult> InsertOrderItem(OrderItemDto orderItem)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var result = _validator.Validate(orderItem);
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
                    .FirstOrDefaultAsync(o => o.OrderId == orderItem.OrderId);
                
                if (order == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order not found" 
                    });

                if (order.Customer?.UserId != currentUserId)
                    return Forbid("You can only add items to your own orders");

                // Verify product exists and is active
                var product = await _db.Products.FindAsync(orderItem.ProductId);
                if (product == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Product not found" 
                    });

                if (!product.IsActive)
                    return BadRequest(new { 
                        success = false, 
                        message = "Product is not available" 
                    });

                // Check stock availability
                if (product.CurrentStock < orderItem.Quantity)
                    return BadRequest(new { 
                        success = false, 
                        message = "Insufficient stock available" 
                    });

                var addOrderItem = new OrderItem
                {
                    OrderId = orderItem.OrderId,
                    ProductId = orderItem.ProductId,
                    Quantity = orderItem.Quantity,
                    UnitPrice = orderItem.UnitPrice,
                    TotalPrice = orderItem.TotalPrice,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.OrderItems.Add(addOrderItem);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Order item created successfully", 
                    data = addOrderItem 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating order item", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Store Owners and Customers with restrictions)
        [HttpPut("{OrderItemId}")]
        public async Task<IActionResult> UpdateOrderItem(int OrderItemId, OrderItemDto orderItem)
        {
            if (OrderItemId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Order Item Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                orderItem.OrderItemId = OrderItemId;
                var updateOrderItem = await _db.OrderItems
                    .Include(oi => oi.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(oi => oi.Product)
                        .ThenInclude(p => p.StoreOwner)
                    .FirstOrDefaultAsync(oi => oi.OrderItemId == OrderItemId);
                
                if (updateOrderItem == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order item not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        hasAccess = updateOrderItem.Product?.StoreOwner?.UserId == currentUserId;
                        break;
                    case "Customer":
                        // Customers can only update items in their pending orders
                        hasAccess = updateOrderItem.Order?.Customer?.UserId == currentUserId && 
                                   updateOrderItem.Order?.Status == "Pending";
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to update this order item");

                updateOrderItem.OrderId = orderItem.OrderId;
                updateOrderItem.ProductId = orderItem.ProductId;
                updateOrderItem.Quantity = orderItem.Quantity;
                updateOrderItem.UnitPrice = orderItem.UnitPrice;
                updateOrderItem.TotalPrice = orderItem.TotalPrice;
                updateOrderItem.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Order item updated successfully", 
                    data = updateOrderItem 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating order item", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners and Customers with restrictions)
        [HttpDelete("{OrderItemId}")]
        public async Task<IActionResult> DeleteOrderItem(int OrderItemId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var orderItem = await _db.OrderItems
                    .Include(oi => oi.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(oi => oi.Product)
                        .ThenInclude(p => p.StoreOwner)
                    .FirstOrDefaultAsync(oi => oi.OrderItemId == OrderItemId);
                
                if (orderItem == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order item not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "StoreOwner":
                        hasAccess = orderItem.Product?.StoreOwner?.UserId == currentUserId;
                        break;
                    case "Customer":
                        // Customers can only delete items from their pending orders
                        hasAccess = orderItem.Order?.Customer?.UserId == currentUserId && 
                                   orderItem.Order?.Status == "Pending";
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to delete this order item");

                _db.OrderItems.Remove(orderItem);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Order item deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting order item", 
                    error = ex.Message 
                });
            }
        }
        #endregion
    }
}
