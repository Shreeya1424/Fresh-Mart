using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMMS.Data;
using SMMS.Models;
using Microsoft.AspNetCore.Authorization;

namespace SMMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class CustomerController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<CustomerDto> _validator;
        public CustomerController(SMDbContext db, IValidator<CustomerDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Store Owners only)
        [HttpGet]
        [Authorize(Roles = "StoreOwner")] // Only store owners can see all customers
        public async Task<IActionResult> GetAllCustomers()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var customers = await _db.Customers
                    .Include(c => c.User)
                    .ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Customers retrieved successfully", 
                    data = customers 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting customers", 
                    error = ex.Message 
                });
            }
        }
        #endregion



        #region get by id
        [HttpGet("{CustomerId}")]
        [Authorize(Roles = "StoreOwner")] // Only store owners can view specific customer details
        public async Task<IActionResult> GetByIdCustomer(int CustomerId)
        {
            try
            {
                var customer = await _db.Customers
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.CustomerId == CustomerId);
                
                if (customer == null)
                    return NotFound(new { message = "Customer not found" });

                return Ok(customer);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting customer", error = ex.Message });
            }
        }
        #endregion

        #region insert (Authenticated users can create customer profile)
        [HttpPost]
        public async Task<IActionResult> InsertCustomer(CustomerDto customer)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                // Check if customer profile already exists for this user
                var existingCustomer = await _db.Customers.FirstOrDefaultAsync(c => c.UserId == customer.UserId);
                if (existingCustomer != null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Customer profile already exists for this user" 
                    });
                }

                var result = _validator.Validate(customer);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                var addCustomer = new Customer
                {
                    UserId = customer.UserId,
                    Address = customer.Address,
                    City = customer.City,
                    State = customer.State,
                    Pincode = customer.Pincode,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.Customers.Add(addCustomer);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "Customer created successfully", 
                    data = addCustomer 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating customer", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Customers can only update their own profile, Store Owners can update any customer)
        [HttpPut("{CustomerId}")]
        public async Task<IActionResult> UpdateCustomer(int CustomerId, CustomerDto customer)
        {
            if (CustomerId <= 0)
                return BadRequest("Invalid Id");

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                customer.CustomerId = CustomerId;
                var updateCustomer = await _db.Customers.FindAsync(CustomerId);
                if (updateCustomer == null)
                    return NotFound(new { message = "Customer not found" });

                // Check permissions
                bool hasAccess = false;
                switch (currentUserRole)
                {
                    case "Customer":
                        // Customers can only update their own profile
                        hasAccess = updateCustomer.UserId == currentUserId;
                        break;
                    case "StoreOwner":
                        // Store owners can update any customer
                        hasAccess = true;
                        break;
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to update this customer profile");

                updateCustomer.UserId = customer.UserId;
                updateCustomer.Address = customer.Address;
                updateCustomer.City = customer.City;
                updateCustomer.State = customer.State;
                updateCustomer.Pincode = customer.Pincode;
                updateCustomer.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Customer updated successfully", 
                    data = updateCustomer 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating customer", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners only)
        [HttpDelete("{CustomerId}")]
        [Authorize(Roles = "StoreOwner")] // Only store owners can delete customers
        public async Task<IActionResult> DeleteCustomer(int CustomerId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var customer = await _db.Customers.FindAsync(CustomerId);
                if (customer == null)
                    return NotFound(new { 
                        success = false, 
                        message = "Customer not found" 
                    });

                // Check if customer has active orders
                var activeOrders = await _db.Orders
                    .Where(o => o.CustomerId == CustomerId && o.Status != "Delivered" && o.Status != "Cancelled")
                    .CountAsync();

                if (activeOrders > 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Cannot delete customer with active orders" 
                    });
                }

                _db.Customers.Remove(customer);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "Customer deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting customer", 
                    error = ex.Message 
                });
            }
        }
        #endregion
    }
}
