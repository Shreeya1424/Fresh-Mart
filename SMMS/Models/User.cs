using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SMMS.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string UserName { get; set; } = null!;

        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = null!;

        [Required]
        [StringLength(15)]
        public string Phone { get; set; } = null!;

        [Required]
        [StringLength(255)]
        public string Password { get; set; } = null!;

        [StringLength(300)]
        public string? ProfileImageUrl { get; set; }

        [Required]
        [StringLength(20)]
        public string Role { get; set; } = "Customer";

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }

        public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();

        public virtual ICollection<DeliveryStaff> DeliveryStaffs { get; set; }  = new List<DeliveryStaff>();

        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();

        public virtual ICollection<StoreOwner> StoreOwners { get; set; }  = new List<StoreOwner>();
    }

    
    public class UserDto
    {
        public int UserId { get; set; }

        public string UserName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public string? ProfileImageUrl { get; set; }

        public string Role { get; set; } = "Customer";

        public bool IsActive { get; set; } = true;
    }
}
