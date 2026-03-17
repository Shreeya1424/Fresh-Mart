using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public class OrderTrackingHistory
    {
        [Key]
        public int TrackingId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [ForeignKey(nameof(OrderId))]
        public Order Order { get; set; } = null!;

        [Required]
        [StringLength(30)]
        public string Status { get; set; } = string.Empty;

        [Required]
        public DateTime StatusTime { get; set; }

        [StringLength(100)]
        public string? Location { get; set; }

        [StringLength(300)]
        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }
    }

    public class OrderTrackingHistoryDto
    {
        public int TrackingId { get; set; }

        public int OrderId { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime StatusTime { get; set; }

        public string? Location { get; set; }

        public string? Note { get; set; }
    }
}
