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
    public class CartItemController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<CartItemDTO> _validator;
        public CartItemController(SMDbContext db, IValidator<CartItemDTO> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Store Owners only - for admin purposes)
        [HttpGet]
        [Authorize(Roles = "StoreOwner")] // Only store owners can view all cart items
        public async Task<IActionResult> GetAllCartItems()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var cartItems = await _db.CartItems
                    .Include(ci => ci.Cart)
                        .ThenInclude(c => c.Customer)
                            .ThenInclude(c => c.User)
                    .Include(ci => ci.Product)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Cart items retrieved successfully", 
                    data = cartItems 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting cart items", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get by id (Customers can only access their own cart items, Store Owners can access any)
        [HttpGet("{CartItemId}")]
        public async Task<IActionResult> GetByIdCartItem(int CartItemId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var cartItem = await _db.CartItems
                    .Include(ci => ci.Cart)
                        .ThenInclude(c => c.Customer)
                            .ThenInclude(c => c.User)
                    .Include(ci => ci.Product)
                    .FirstOrDefaultAsync(ci => ci.CartItemId == CartItemId);
                
                if (cartItem == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Cart item not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "Customer":
                        // Customers can only access their own cart items
                        hasAccess = cartItem.Cart?.Customer?.UserId == currentUserId;
                        break;
                    case "StoreOwner":
                        // Store owners can access any cart item
                        hasAccess = true;
                        break;
                    case "Admin":
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to access this cart item");

                return Ok(new { 
                    success = true, 
                    message = "Cart item retrieved successfully", 
                    data = cartItem 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting cart item", 
                    error = ex.Message 
                });
            }
        }
        #endregion



        #region insert (Customers can only add items to their own cart)
        [HttpPost]
        [Authorize(Roles = "Customer")] // Only customers can add items to cart
        public async Task<IActionResult> InsertCartItem(CartItemDTO cartItem)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                // Validate the cart belongs to the current customer
                var cart = await _db.Carts
                    .Include(c => c.Customer)
                    .FirstOrDefaultAsync(c => c.CartId == cartItem.CartId);
                
                if (cart == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Cart not found" 
                    });

                if (cart.Customer?.UserId != currentUserId)
                    return Forbid("You can only add items to your own cart");

                // Check if product exists
                var product = await _db.Products.FindAsync(cartItem.ProductId);
                if (product == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Product not found" 
                    });

                // Check if product is active
                if (!product.IsActive)
                    return BadRequest(new { 
                        success = false, 
                        message = "Product is not available" 
                    });

                // Check stock availability
                if (product.CurrentStock < cartItem.Quantity)
                    return BadRequest(new { 
                        success = false, 
                        message = $"Insufficient stock. Available: {product.CurrentStock}" 
                    });

                var result = _validator.Validate(cartItem);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                // Check if item already exists in cart
                var existingItem = await _db.CartItems
                    .FirstOrDefaultAsync(ci => ci.CartId == cartItem.CartId && ci.ProductId == cartItem.ProductId);
                
                if (existingItem != null)
                {
                    // Update quantity instead of creating new item
                    existingItem.Quantity += cartItem.Quantity;
                    existingItem.ModifiedAt = DateTime.UtcNow;
                    
                    // Check stock again with updated quantity
                    if (product.CurrentStock < existingItem.Quantity)
                        return BadRequest(new { 
                            success = false, 
                            message = $"Insufficient stock. Available: {product.CurrentStock}, Requested: {existingItem.Quantity}" 
                        });

                    await _db.SaveChangesAsync();
                    
                    return Ok(new { 
                        success = true, 
                        message = "Cart item quantity updated successfully", 
                        data = existingItem 
                    });
                }

                var addItem = new CartItem
                {
                    CartId = cartItem.CartId,
                    ProductId = cartItem.ProductId,
                    Quantity = cartItem.Quantity,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.CartItems.Add(addItem);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Cart item added successfully", 
                    data = addItem 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating cart item", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Customers can only update their own cart items)
        [HttpPut("{CartItemId}")]
        [Authorize(Roles = "Customer")] // Only customers can update cart items
        public async Task<IActionResult> UpdateCartItem(int CartItemId, CartItemDTO cartItem)
        {
            if (CartItemId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Cart Item Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                cartItem.CartItemId = CartItemId;

                var updateItem = await _db.CartItems
                    .Include(ci => ci.Cart)
                        .ThenInclude(c => c.Customer)
                    .Include(ci => ci.Product)
                    .FirstOrDefaultAsync(ci => ci.CartItemId == CartItemId);
                
                if (updateItem == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Cart item not found" 
                    });

                // Check if cart item belongs to current customer
                if (updateItem.Cart?.Customer?.UserId != currentUserId)
                    return Forbid("You can only update your own cart items");

                // Check stock availability
                if (updateItem.Product?.CurrentStock < cartItem.Quantity)
                    return BadRequest(new { 
                        success = false, 
                        message = $"Insufficient stock. Available: {updateItem.Product?.CurrentStock}" 
                    });

                updateItem.CartId = cartItem.CartId;
                updateItem.ProductId = cartItem.ProductId;
                updateItem.Quantity = cartItem.Quantity;
                updateItem.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Cart item updated successfully", 
                    data = updateItem 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating cart item", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Customers can only delete their own cart items)
        [HttpDelete("{CartItemId}")]
        [Authorize(Roles = "Customer")] // Only customers can delete cart items
        public async Task<IActionResult> DeleteCartItem(int CartItemId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var cartItem = await _db.CartItems
                    .Include(ci => ci.Cart)
                        .ThenInclude(c => c.Customer)
                    .FirstOrDefaultAsync(ci => ci.CartItemId == CartItemId);
                
                if (cartItem == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Cart item not found" 
                    });

                // Check if cart item belongs to current customer
                if (cartItem.Cart?.Customer?.UserId != currentUserId)
                    return Forbid("You can only delete your own cart items");

                _db.CartItems.Remove(cartItem);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Cart item deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting cart item", 
                    error = ex.Message 
                });
            }
        }
        #endregion


    }
}
