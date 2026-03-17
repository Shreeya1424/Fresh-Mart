using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SMMS.Models
{
    public class Category
    {
        [Key]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        public bool IsActive { get; set; } = true;

        [StringLength(300)]
        public string? Description { get; set; } = "Default Description";

        [StringLength(100)]
        public string? IconName { get; set; } = "N/A";

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }

        public virtual ICollection<Product> Products { get; set; } = new List<Product>();

        public virtual ICollection<SubCategory> SubCategories { get; set; } = new List<SubCategory>();

    }
        public class CategoryDto
        {
        public int CategoryId { get; set; }

        
            public string Name { get; set; } = string.Empty;

            public bool IsActive { get; set; } = true;

            public string? Description { get; set; }

            public string? IconName { get; set; }
        }
}

