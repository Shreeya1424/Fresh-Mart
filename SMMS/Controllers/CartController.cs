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
    public class CartController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<CartDTO> _validator;
        public CartController(SMDbContext db, IValidator<CartDTO> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Store Owners only - for admin purposes)
        [HttpGet]
        [Authorize(Roles = "StoreOwner")] // Only store owners can view all carts
        public async Task<IActionResult> GetAllCart()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var carts = await _db.Carts
                    .Include(c => c.Customer)
                        .ThenInclude(c => c.User)
                    .Include(c => c.CartItems)
                        .ThenInclude(ci => ci.Product)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Carts retrieved successfully", 
                    data = carts 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting carts", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region get by id (Customers can only access their own cart, Store Owners can access any cart)
        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyCart()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var customer = await _db.Customers.FirstOrDefaultAsync(c => c.UserId == currentUserId);
                if (customer == null)
                {
                    var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == currentUserId);
                    if (user == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Customer profile not found for current user"
                        });
                    }

                    customer = new Customer
                    {
                        UserId = user.UserId,
                        Address = null,
                        City = null,
                        State = null,
                        Pincode = null,
                        CreatedAt = DateTime.UtcNow,
                        ModifiedAt = DateTime.UtcNow
                    };

                    _db.Customers.Add(customer);
                    await _db.SaveChangesAsync();
                }

                var cart = await _db.Carts
                    .Include(c => c.Customer)
                        .ThenInclude(c => c.User)
                    .Include(c => c.CartItems)
                        .ThenInclude(ci => ci.Product)
                    .FirstOrDefaultAsync(c => c.CustomerId == customer.CustomerId);
                
                if (cart == null)
                {
                    // Create a cart automatically if it doesn't exist
                    cart = new Cart
                    {
                        CustomerId = customer.CustomerId,
                        CreatedAt = DateTime.UtcNow,
                        ModifiedAt = DateTime.UtcNow
                    };
                    _db.Carts.Add(cart);
                    await _db.SaveChangesAsync();
                    
                    // Reload with includes
                    cart = await _db.Carts
                        .Include(c => c.Customer)
                            .ThenInclude(c => c.User)
                        .Include(c => c.CartItems)
                            .ThenInclude(ci => ci.Product)
                        .FirstOrDefaultAsync(c => c.CartId == cart.CartId);
                }

                return Ok(new { 
                    success = true, 
                    message = "Cart retrieved successfully", 
                    data = cart 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting cart", 
                    error = ex.Message 
                });
            }
        }

        [HttpGet("{CartId}")]
        public async Task<IActionResult> GetByIdCart(int CartId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var cart = await _db.Carts
                    .Include(c => c.Customer)
                        .ThenInclude(c => c.User)
                    .Include(c => c.CartItems)
                        .ThenInclude(ci => ci.Product)
                    .FirstOrDefaultAsync(c => c.CartId == CartId);
                
                if (cart == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Cart not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "Customer":
                        // Customers can only access their own cart
                        hasAccess = cart.Customer?.UserId == currentUserId;
                        break;
                    case "StoreOwner":
                        // Store owners can access any cart
                        hasAccess = true;
                        break;
                    case "Admin":
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to access this cart");

                return Ok(new { 
                    success = true, 
                    message = "Cart retrieved successfully", 
                    data = cart 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting cart", 
                    error = ex.Message 
                });
            }
        }
        #endregion



        #region insert (Customers can create their own cart)
        [HttpPost]
        [Authorize(Roles = "Customer")] // Only customers can create carts
        public async Task<IActionResult> InsertCart(CartDTO cart)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                // Get or create customer record for current user
                var customer = await _db.Customers.FirstOrDefaultAsync(c => c.UserId == currentUserId);
                if (customer == null)
                {
                    var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == currentUserId);
                    if (user == null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Customer profile not found for current user"
                        });
                    }

                    customer = new Customer
                    {
                        UserId = user.UserId,
                        Address = null,
                        City = null,
                        State = null,
                        Pincode = null,
                        CreatedAt = DateTime.UtcNow,
                        ModifiedAt = DateTime.UtcNow
                    };

                    _db.Customers.Add(customer);
                    await _db.SaveChangesAsync();
                }

                // Check if customer already has a cart
                var existingCart = await _db.Carts.FirstOrDefaultAsync(c => c.CustomerId == customer.CustomerId);
                if (existingCart != null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Customer already has a cart", 
                        data = existingCart 
                    });
                }

                var result = _validator.Validate(cart);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                var addCart = new Cart
                {
                    CustomerId = customer.CustomerId, // Use authenticated customer's ID
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.Carts.Add(addCart);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Cart created successfully", 
                    data = addCart 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating cart", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Customers can only update their own cart, Store Owners can update any cart)
        [HttpPut("{CartId}")]
        public async Task<IActionResult> UpdateCart(int CartId, CartDTO cart)
        {
            if (CartId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid Cart Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                cart.CartId = CartId;

                var updateCart = await _db.Carts
                    .Include(c => c.Customer)
                    .FirstOrDefaultAsync(c => c.CartId == CartId);
                
                if (updateCart == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Cart not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "Customer":
                        // Customers can only update their own cart
                        hasAccess = updateCart.Customer?.UserId == currentUserId;
                        break;
                    case "StoreOwner":
                        // Store owners can update any cart
                        hasAccess = true;
                        break;
                    case "Admin":
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to update this cart");

                updateCart.CustomerId = cart.CustomerId;
                updateCart.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Cart updated successfully", 
                    data = updateCart 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating cart", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Customers can only delete their own cart, Store Owners can delete any cart)
        [HttpDelete("{CartId}")]
        public async Task<IActionResult> DeleteCart(int CartId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var cart = await _db.Carts
                    .Include(c => c.Customer)
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.CartId == CartId);
                
                if (cart == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Cart not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "Customer":
                        // Customers can only delete their own cart
                        hasAccess = cart.Customer?.UserId == currentUserId;
                        break;
                    case "StoreOwner":
                        // Store owners can delete any cart
                        hasAccess = true;
                        break;
                    case "Admin":
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to delete this cart");

                // Remove all cart items first
                if (cart.CartItems?.Any() == true)
                {
                    _db.CartItems.RemoveRange(cart.CartItems);
                }

                _db.Carts.Remove(cart);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Cart deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting cart", 
                    error = ex.Message 
                });
            }
        }
        #endregion


    }
}
