using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMMS.Data;
using SMMS.Models;
using System;
using System.Data;


namespace SMMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class UserController : BaseController // Inherit from BaseController
    {
        private readonly SMDbContext _db;

        public IValidator<UserDto> _validator;
        public UserController(SMDbContext db, IValidator<UserDto> validator)
        {
            _db = db;
            _validator = validator;
        }

        #region get all (Store Owners and Admins only)
        [HttpGet]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> GetAllUsers()
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

                var users = await _db.Users.ToListAsync();
                
                return Ok(new { 
                    success = true, 
                    message = "Users retrieved successfully", 
                    data = users 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting users", 
                    error = ex.Message 
                });
            }
        }
        #endregion



        #region get by id (Users can view their own profile, Admins can view any)
        [HttpGet("{UserId}")]
        public async Task<IActionResult> GetByIdUsers(int UserId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _db.Users.FindAsync(UserId);
                if (user == null)
                    return NotFound(new { 
                        success = false, 
                        message = "User not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                if (currentUserRole == "Admin" || currentUserRole == "StoreOwner")
                {
                    hasAccess = true; // Admin or Store owners can view any user
                }
                else
                {
                    hasAccess = UserId == currentUserId; // Users can only view their own profile
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to view this user profile");

                return Ok(new { 
                    success = true, 
                    message = "User retrieved successfully", 
                    data = user 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error getting user", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region insert (Public registration)
        [HttpPost]
        [AllowAnonymous] // Allow public registration
        public async Task<IActionResult> InsertUser(UserDto user)
        {
            try
            {
                var result = _validator.Validate(user);
                if(!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                bool exists = await _db.Users.AnyAsync(u => u.UserName == user.UserName || u.Email == user.Email);
                if (exists)
                    return BadRequest(new { 
                        success = false, 
                        message = "User with this username or email already exists" 
                    });

                var adduser = new User
                {
                    UserName = user.UserName,
                    Email = user.Email,
                    Phone = user.Phone,
                    Password = user.Password, // In production, this should be hashed
                    Role = user.Role ?? "Customer", // Default role is Customer
                    ProfileImageUrl = user.ProfileImageUrl,
                    IsActive = user.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow
                };

                _db.Users.Add(adduser);
                await _db.SaveChangesAsync();

                return Created("", new { 
                    success = true, 
                    message = "User created successfully", 
                    data = new { 
                        UserId = adduser.UserId, 
                        UserName = adduser.UserName, 
                        Email = adduser.Email, 
                        Role = adduser.Role 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error creating user", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region update (Users can update their own profile, Admins can update any)
        [HttpPut("{UserId}")]
        public async Task<IActionResult> UpdateUser(int UserId, UserDto user)
        {
            if (UserId <= 0)
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid User Id" 
                });

            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                if (currentUserId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                user.UserId = UserId;

                var result = await _validator.ValidateAsync(user);
                if (!result.IsValid)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = result.Errors.Select(e => e.ErrorMessage).ToList() 
                    });
                }

                var updateUser = await _db.Users.FindAsync(UserId);
                if (updateUser == null)
                    return NotFound(new { 
                        success = false, 
                        message = "User not found" 
                    });

                // Check permissions
                bool hasAccess = false;
                if (currentUserRole == "Admin" || currentUserRole == "StoreOwner")
                {
                    hasAccess = true; // Admin or Store owners can update any user
                }
                else
                {
                    hasAccess = UserId == currentUserId; // Users can only update their own profile
                }

                if (!hasAccess)
                    return Forbid("You don't have permission to update this user profile");

                // Check if username/email is already taken by another user
                bool exists = await _db.Users.AnyAsync(u => u.UserId != UserId && 
                    (u.UserName == user.UserName || u.Email == user.Email));
                if (exists)
                    return BadRequest(new { 
                        success = false, 
                        message = "Username or email is already taken by another user" 
                    });

                updateUser.UserName = user.UserName;
                updateUser.Email = user.Email;
                updateUser.Phone = user.Phone;
                updateUser.Password = user.Password; // In production, this should be hashed
                
                // Only admins or store owners can change roles and active status
                if (currentUserRole == "Admin" || currentUserRole == "StoreOwner")
                {
                    updateUser.Role = user.Role;
                    updateUser.IsActive = user.IsActive;
                }
                
                updateUser.ProfileImageUrl = user.ProfileImageUrl;
                updateUser.ModifiedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "User updated successfully", 
                    data = updateUser 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error updating user", 
                    error = ex.Message 
                });
            }
        }
        #endregion

        #region delete (Store Owners and Admins only)
        [HttpDelete("{UserId}")]
        [Authorize] // Admin or StoreOwner
        public async Task<IActionResult> DeleteUser(int UserId)
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

                var user = await _db.Users.FindAsync(UserId);
                if (user == null)
                    return NotFound(new { 
                        success = false, 
                        message = "User not found" 
                    });

                // Prevent store owner from deleting themselves
                if (UserId == currentUserId)
                    return BadRequest(new { 
                        success = false, 
                        message = "You cannot delete your own account" 
                    });

                _db.Users.Remove(user);
                await _db.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = "User deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error deleting user", 
                    error = ex.Message 
                });
            }

        }
        #endregion


    }
}
