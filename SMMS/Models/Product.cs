using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = null!;

        [StringLength(100)]
        public string? Brand { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public Category Category { get; set; } = null!;

        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        [StringLength(500)]
        public string? Description { get; set; } = "Default Description";

        public bool IsFeatured { get; set; } = false;

        [Required]
        [StringLength(300)]
        public string ImageUrl { get; set; } = null!;

        [Range(0, int.MaxValue)]
        public int CurrentStock { get; set; }

        [Range(0, int.MaxValue)]
        public int LowStockValue { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public int StoreOwnerId { get; set; }

        [ForeignKey(nameof(StoreOwnerId))]
        public StoreOwner StoreOwner { get; set; } = null!;

        public int? SubCategoryId { get; set; }

        [ForeignKey(nameof(SubCategoryId))]
        public SubCategory? SubCategory { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }

        public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }

    
    public class ProductDto
    {
        public int ProductId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Brand { get; set; }

        public int CategoryId { get; set; }

        public decimal Price { get; set; }

        public string? Description { get; set; }

        public bool IsFeatured { get; set; } = false;

        public string ImageUrl { get; set; } = string.Empty;

        public int CurrentStock { get; set; }

        public int LowStockValue { get; set; }

        public bool IsActive { get; set; } = true;

        public int StoreOwnerId { get; set; }

        public int? SubCategoryId { get; set; }
    }
}
