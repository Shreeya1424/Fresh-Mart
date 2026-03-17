using System;
using System.ComponentModel.DataAnnotations;

namespace SMMS.Models
{
    public class Zone
    {
        [Key]
        public int ZoneId { get; set; }

        [Required]
        [StringLength(100)]
        public string ZoneName { get; set; } = string.Empty;

        [StringLength(300)]
        public string? Description { get; set; }

        [Range(100000, 999999)]
        public int? PincodeNumber { get; set; }

        [Required]
        [StringLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string State { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Country { get; set; } = "India";

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }
    }

   
    public class ZoneDto
    {
        public int ZoneId { get; set; }

        public string ZoneName { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int? PincodeNumber { get; set; }

        public string City { get; set; } = string.Empty;

        public string State { get; set; } = string.Empty;

        public string Country { get; set; } = "India";

        public bool IsActive { get; set; } = true;
    }
}
