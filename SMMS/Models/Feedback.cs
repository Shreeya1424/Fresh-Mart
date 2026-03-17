using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public class Feedback
    {
        [Key]
        public int FeedbackId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        public int? OrderId { get; set; }

        [ForeignKey(nameof(OrderId))]
        public Order? Order { get; set; }

        public int? ProductId { get; set; }

        [ForeignKey(nameof(ProductId))]
        public Product? Product { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(500)]
        public string? Comment { get; set; }

        [Required]
        [StringLength(20)]
        public string FeedbackTargetType { get; set; } = null!;

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }
    }

   
    public class FeedbackDto
    {
        public int FeedbackId { get; set; }

        public int UserId { get; set; }

        public int? OrderId { get; set; }

        public int? ProductId { get; set; }

        public int Rating { get; set; }

        public string? Comment { get; set; }
        public string FeedbackTargetType { get; set; } = string.Empty;
    }
}
