using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public Customer Customer { get; set; } = null!;

        [Required]
        public DateTime OrderDate { get; set; }

        [StringLength(50)]
        public string? OrderNumber { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        [Required]
        [StringLength(20)]
        public string PaymentMode { get; set; } = null!;

        [Range(0, double.MaxValue)]
        public decimal TotalAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal DeliveryCharge { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? FinalAmount { get; set; }

        [StringLength(300)]
        public string? CancelledReason { get; set; }

        [StringLength(50)]
        public string? TrackingNumber { get; set; }

        public DateTime? EstimatedDeliveryDate { get; set; }
        public DateTime? DeliveredDate { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }

        public virtual ICollection<DeliveryStaffAssignment> DeliveryStaffAssignments { get; set; } = new List<DeliveryStaffAssignment>();

        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();

        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

        public virtual ICollection<OrderTrackingHistory> OrderTrackingHistories { get; set; } = new List<OrderTrackingHistory>();
    }

    
    public class OrderDto
    {
        public int OrderId { get; set; }

        public int CustomerId { get; set; }

        public DateTime OrderDate { get; set; }

        public string? OrderNumber { get; set; }

        public string Status { get; set; } = "Pending";

        
        public string PaymentMode { get; set; } = null!;

        public decimal TotalAmount { get; set; }

        public decimal DeliveryCharge { get; set; }

        public decimal? FinalAmount { get; set; }

        public string? CancelledReason { get; set; }

        public string? TrackingNumber { get; set; }

        public DateTime? EstimatedDeliveryDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        
        public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
    }
}
