using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMMS.Models
{
    public class SubCategory
    {
        [Key]
        public int SubCategoryId { get; set; }

        [Required]
        [StringLength(100)]
        public string SubCategoryName { get; set; } = null!;

        [Required]
        public int CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public Category Category { get; set; } = null!;

        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }

    
    public class SubCategoryDto
    {
        public int SubCategoryId { get; set; }

        public string SubCategoryName { get; set; } = string.Empty;

        public int CategoryId { get; set; }
    }
}
