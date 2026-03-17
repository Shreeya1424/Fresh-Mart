using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [ForeignKey(nameof(OrderId))]
        public Order Order { get; set; } = null!;

        [Range(0, double.MaxValue)]
        public decimal AmountPaid { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = null!;

        public DateTime? PaymentDate { get; set; }

        [StringLength(100)]
        public string? TransactionId { get; set; }

        [Required]
        [StringLength(20)]
        public string PaymentMode { get; set; } = null!;
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }
    }

    
    public class PaymentDto
    {
        public int PaymentId { get; set; }

        public int OrderId { get; set; }

        public string Status { get; set; } = null!;

        public decimal AmountPaid { get; set; }

        public string? TransactionId { get; set; }

        public string PaymentMode { get; set; } = string.Empty;

        public DateTime? PaymentDate { get; set; }

        public string? CardNumber { get; set; }

        public string? CardCvv { get; set; }

        public string? CardExpiry { get; set; }

        public string? UpiId { get; set; }

    }
}
