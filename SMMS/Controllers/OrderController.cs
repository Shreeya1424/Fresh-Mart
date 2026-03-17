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
    public class OrderController : BaseController
    {
        private readonly SMDbContext _db;
        public IValidator<OrderDto> _validator;

        public OrderController(SMDbContext db, IValidator<OrderDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all orders (Role-based access)
        [HttpGet]
        public async Task<IActionResult> GetAllOrders()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                IQueryable<Order> ordersQuery = _db.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .Include(o => o.Payments)
                    .Include(o => o.DeliveryStaffAssignments);

                // Filter orders based on user role
                switch (currentUserRole)
                {
                    case "Admin":
                        // Admins can see all orders
                        break;

                    case "Customer":
                        // Customers can only see their own orders
                        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.UserId == currentUserId);
                        if (customer == null)
                            return Forbid("User is not a customer");
                        ordersQuery = ordersQuery.Where(o => o.CustomerId == customer.CustomerId);
                        break;

                    case "StoreOwner":
                        // Store owners can see orders for their products
                        var storeOwner = await _db.StoreOwners.FirstOrDefaultAsync(so => so.UserId == currentUserId);
                        if (storeOwner == null)
                            return Forbid("User is not a store owner");
                        
                        ordersQuery = ordersQuery.Where(o => o.OrderItems.Any(oi => 
                            oi.Product.StoreOwnerId == storeOwner.StoreOwnerId));
                        break;

                    case "DeliveryStaff":
                        // Delivery staff can see orders assigned to them
                        var deliveryStaff = await _db.DeliveryStaffs.FirstOrDefaultAsync(ds => ds.UserId == currentUserId);
                        if (deliveryStaff == null)
                            return Forbid("User is not delivery staff");
                        
                        ordersQuery = ordersQuery.Where(o => o.DeliveryStaffAssignments.Any(dsa => 
                            dsa.StaffId == deliveryStaff.StaffId));
                        break;

                    default:
                        return Forbid("Invalid user role");
                }

                var orders = await ordersQuery.ToListAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting orders", error = ex.Message });
            }
        }
        #endregion

        #region get by id (Role-based access)
        [HttpGet("{OrderId}")]
        public async Task<IActionResult> GetByIdOrder(int OrderId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var order = await _db.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .Include(o => o.Payments)
                    .Include(o => o.DeliveryStaffAssignments)
                    .FirstOrDefaultAsync(o => o.OrderId == OrderId);

                if (order == null)
                    return NotFound(new { message = "Order not found" });

                // Check if user has permission to view this order
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "Admin":
                        hasAccess = true;
                        break;

                    case "Customer":
                        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.UserId == currentUserId);
                        hasAccess = customer != null && order.CustomerId == customer.CustomerId;
                        break;

                    case "StoreOwner":
                        var storeOwner = await _db.StoreOwners.FirstOrDefaultAsync(so => so.UserId == currentUserId);
                        hasAccess = storeOwner != null && order.OrderItems.Any(oi => 
                            oi.Product.StoreOwnerId == storeOwner.StoreOwnerId);
                        break;

                    case "DeliveryStaff":
                        var deliveryStaff = await _db.DeliveryStaffs.FirstOrDefaultAsync(ds => ds.UserId == currentUserId);
                        hasAccess = deliveryStaff != null && order.DeliveryStaffAssignments.Any(dsa => 
                            dsa.StaffId == deliveryStaff.StaffId);
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to view this order");

                return Ok(order);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting order", error = ex.Message });
            }
        }
        #endregion

        #region insert
        [HttpPost]
        public async Task<IActionResult> InsertOrder(OrderDto order)
        {
            try
            {
                //if (!ModelState.IsValid)
                //    return BadRequest(ModelState);

                var result = _validator.Validate(order);
                if (!result.IsValid)
                {
                    return StatusCode(400, result.Errors.ToList());
                }

                var addOrder = new Order();
                addOrder.CustomerId = order.CustomerId;
                addOrder.OrderDate = order.OrderDate;
                addOrder.OrderNumber = order.OrderNumber;
                addOrder.Status = order.Status;
                addOrder.PaymentMode = order.PaymentMode;
                addOrder.TotalAmount = order.TotalAmount;
                addOrder.DeliveryCharge = order.DeliveryCharge;
                addOrder.FinalAmount = order.FinalAmount;
                addOrder.CancelledReason = order.CancelledReason;
                addOrder.TrackingNumber = order.TrackingNumber;
                addOrder.EstimatedDeliveryDate = order.EstimatedDeliveryDate;
                addOrder.DeliveredDate = order.DeliveredDate;
                addOrder.CreatedAt = DateTime.Now;
                addOrder.ModifiedAt = DateTime.Now;

                _db.Orders.Add(addOrder);
                await _db.SaveChangesAsync();

                order.OrderId = addOrder.OrderId;

                if (order.Items != null && order.Items.Any())
                {
                    var items = order.Items.Select(i => new OrderItem
                    {
                        OrderId = addOrder.OrderId,
                        ProductId = i.ProductId,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        TotalPrice = i.TotalPrice,
                        CreatedAt = DateTime.Now
                    }).ToList();
                    
                    _db.OrderItems.AddRange(items);
                    await _db.SaveChangesAsync();
                }

                return Created("", order);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating order", error = ex.Message });
            }
        }
        #endregion

        #region update
        [HttpPut("{OrderId}")]
        public async Task<IActionResult> UpdateOrder(int OrderId, OrderDto order)
        {
            //if (OrderId != order.OrderId)
            //    return BadRequest("Id Mismatch");

            if (OrderId <= 0)
                return BadRequest("Invalid Id");

            try
            {
                order.OrderId = OrderId;
                var updateOrder = await _db.Orders.FindAsync(OrderId);
                if (updateOrder == null)
                    return NotFound(new { message = "Order not found" });

                updateOrder.CustomerId = order.CustomerId;
                updateOrder.OrderDate = order.OrderDate;
                updateOrder.OrderNumber = order.OrderNumber;
                updateOrder.Status = order.Status;
                updateOrder.PaymentMode = order.PaymentMode;
                updateOrder.TotalAmount = order.TotalAmount;
                updateOrder.DeliveryCharge = order.DeliveryCharge;
                updateOrder.FinalAmount = order.FinalAmount;
                updateOrder.CancelledReason = order.CancelledReason;
                updateOrder.TrackingNumber = order.TrackingNumber;
                updateOrder.EstimatedDeliveryDate = order.EstimatedDeliveryDate;
                updateOrder.DeliveredDate = order.DeliveredDate;
                updateOrder.ModifiedAt = DateTime.Now;

                await _db.SaveChangesAsync();

                return Ok(updateOrder);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating order", error = ex.Message });
            }
        }
        #endregion

        #region delete (Role-based access)
        [HttpDelete("{OrderId}")]
        public async Task<IActionResult> DeleteOrder(int OrderId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var order = await _db.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .Include(o => o.Payments)
                    .Include(o => o.DeliveryStaffAssignments)
                    .FirstOrDefaultAsync(o => o.OrderId == OrderId);

                if (order == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Order not found" 
                    });

                // Check if user has permission to delete this order
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "Admin":
                        hasAccess = true;
                        break;

                    case "Customer":
                        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.UserId == currentUserId);
                        hasAccess = customer != null && order.CustomerId == customer.CustomerId && 
                                   (order.Status == "Pending" || order.Status == "Processing");
                        break;

                    case "StoreOwner":
                        var storeOwner = await _db.StoreOwners.FirstOrDefaultAsync(so => so.UserId == currentUserId);
                        hasAccess = storeOwner != null && order.OrderItems.Any(oi => 
                            oi.Product.StoreOwnerId == storeOwner.StoreOwnerId);
                        break;

                    default:
                        hasAccess = false;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to delete this order");

                // Check if order can be deleted (only pending or cancelled orders)
                if (order.Status != "Pending" && order.Status != "Cancelled")
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Only pending or cancelled orders can be deleted" 
                    });
                }

                // Remove related records first
                if (order.OrderItems?.Any() == true)
                {
                    _db.OrderItems.RemoveRange(order.OrderItems);
                }

                if (order.Payments?.Any() == true)
                {
                    _db.Payments.RemoveRange(order.Payments);
                }

                if (order.DeliveryStaffAssignments?.Any() == true)
                {
                    _db.DeliveryStaffAssignments.RemoveRange(order.DeliveryStaffAssignments);
                }

                _db.Orders.Remove(order);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Order deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting order", 
                    error = ex.Message 
                });
            }
        }
        #endregion


    }
}
