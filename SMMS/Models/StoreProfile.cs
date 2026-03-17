using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public class StoreProfile
    {
        [Key]
        public int StoreId { get; set; }

        [Required]
        [StringLength(150)]
        public string StoreName { get; set; } = null!;

        [Required]
        public int OwnerId { get; set; }

        [ForeignKey(nameof(OwnerId))]
        public StoreOwner Owner { get; set; } = null!;

        [Required]
        [StringLength(300)]
        public string Address { get; set; } = null!;

        [Required]
        [StringLength(15)]
        public string Phone { get; set; } = null!;

        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = null!;

        [StringLength(500)]
        public string Description { get; set; } = null!;

        [Range(0, 100)]
        public double DeliveryRadiusKm { get; set; }

        [Required]
        public TimeSpan OpeningTime { get; set; }

        [Required]
        public TimeSpan ClosingTime { get; set; }

        [Required]
        [StringLength(20)]
        public string Gstnumber { get; set; } = null!;

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }
    }

    
    public class StoreProfileDto
    {
        public int StoreId { get; set; }

        public string StoreName { get; set; } = string.Empty;

        public int OwnerId { get; set; }

        public string Address { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public double DeliveryRadiusKm { get; set; }

        public TimeSpan OpeningTime { get; set; }

        public TimeSpan ClosingTime { get; set; }

        public string Gstnumber { get; set; } = string.Empty;
    }
}
