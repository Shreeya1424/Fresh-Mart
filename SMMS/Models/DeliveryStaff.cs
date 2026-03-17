using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public partial class DeliveryStaff
    {
        [Key]
        public int StaffId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [Required]
        public int? ZoneId { get; set; }

        [ForeignKey(nameof(ZoneId))]
        public Zone? Zone { get; set; }

        [Required]
        [StringLength(50)]
        public string VehicleType { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string VehicleNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string LicenseNumber { get; set; } = string.Empty;

        [Range(0, 5)]
        public double Rating { get; set; } = 0;

        [Range(0, 10)]
        public int CurrentLoad { get; set; } = 0;

        [Range(1, 10)]
        public int MaxLoad { get; set; } = 5;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Available";

        [Range(0, int.MaxValue)]
        public int TotalDeliveriesCompleted { get; set; } = 0;

        [Range(0, double.MaxValue)]
        public decimal TotalEarnings { get; set; } = 0;

        [Required]
        [StringLength(20)]
        public string EmploymentStatus { get; set; } = "Active";

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }

        public virtual ICollection<DeliveryStaffAssignment> DeliveryStaffAssignments { get; set; } = new List<DeliveryStaffAssignment>();
    }

    public class DeliveryStaffDTO
    {
        public int StaffId { get; set; }

        public int UserId { get; set; }

        public int? ZoneId { get; set; }

        public string VehicleType { get; set; } = string.Empty;

        public string VehicleNumber { get; set; } = string.Empty;

        public string LicenseNumber { get; set; } = string.Empty;

        public int MaxLoad { get; set; } = 5;

        public string Status { get; set; } = "Available";

        public int TotalDeliveriesCompleted { get; set; } = 0;

        public decimal TotalEarnings { get; set; } = 0;

        public string EmploymentStatus { get; set; } = "Active";
    }

    public class DeliveryStaffProfileUpdateDto
    {
        public string UserName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string VehicleType { get; set; } = string.Empty;

        public string VehicleNumber { get; set; } = string.Empty;

        public string LicenseNumber { get; set; } = string.Empty;
    }
}
