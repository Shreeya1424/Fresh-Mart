using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public class DeliveryStaffAssignment
    {
        [Key]
        public int AssignmentId { get; set; }

        [Required]
        public int StaffId { get; set; }

        [ForeignKey(nameof(StaffId))]
        public DeliveryStaff DeliveryStaff { get; set; } = null!;

        [Required]
        public int OrderId { get; set; }

        [ForeignKey(nameof(OrderId))]
        public Order Order { get; set; } = null!;

        [Required]
        public DateTime AssignedDate { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = null!;

        [StringLength(500)]
        public string? Note { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }
    }

    public class DeliveryStaffAssignmentDto
    {
        public int AssignmentId { get; set; }

        public int StaffId { get; set; }

        public int OrderId { get; set; }

        public DateTime AssignedDate { get; set; }

        public string Status { get; set; } = string.Empty;

        public string? Note { get; set; }
    }
}
