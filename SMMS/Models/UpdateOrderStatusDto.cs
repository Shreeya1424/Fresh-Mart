namespace SMMS.Models
{
    public class UpdateOrderStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }

    public class AssignOrderDto
    {
        public int DeliveryStaffId { get; set; }
        public string? Notes { get; set; }
    }
}