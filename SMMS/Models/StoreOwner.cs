using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public class StoreOwner
    {
        [Key]
        public int StoreOwnerId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }

        public virtual ICollection<Product> Products { get; set; }  = new List<Product>();

        public virtual ICollection<StoreProfile> StoreProfiles { get; set; }  = new List<StoreProfile>();
    }

    
    public class StoreOwnerDto
    {
        public int StoreOwnerId { get; set; }

        public int UserId { get; set; }
    }
}
