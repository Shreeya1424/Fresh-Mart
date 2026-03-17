using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SMMS.Migrations
{
    /// <inheritdoc />
    public partial class seedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "CustomerId", "Address", "City", "CreatedAt", "ModifiedAt", "Pincode", "State", "UserId" },
                values: new object[,]
                {
                    { 1, null, "Ahmedabad", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, "Gujarat", 9 },
                    { 2, null, "Surat", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, "Gujarat", 10 }
                });

            migrationBuilder.InsertData(
                table: "StoreOwners",
                columns: new[] { "StoreOwnerId", "CreatedAt", "ModifiedAt", "UserId" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 1 },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 3 }
                });

            migrationBuilder.InsertData(
                table: "Zones",
                columns: new[] { "ZoneId", "City", "Country", "CreatedAt", "Description", "IsActive", "ModifiedAt", "PincodeNumber", "State", "ZoneName" },
                values: new object[,]
                {
                    { 1, "Ahmedabad", "India", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, true, null, 380001, "Gujarat", "North Zone" },
                    { 2, "Surat", "India", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, true, null, 395003, "Gujarat", "South Zone" }
                });

            migrationBuilder.InsertData(
                table: "Carts",
                columns: new[] { "CartId", "CreatedAt", "CustomerId", "ModifiedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 1, null },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 2, null }
                });

            migrationBuilder.InsertData(
                table: "DeliveryStaffs",
                columns: new[] { "StaffId", "CreatedAt", "CurrentLoad", "EmploymentStatus", "LicenseNumber", "MaxLoad", "ModifiedAt", "Rating", "Status", "TotalDeliveriesCompleted", "TotalEarnings", "UserId", "VehicleNumber", "VehicleType", "ZoneId" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 0, "Active", "LIC001", 5, null, 0.0, "Available", 0, 0m, 3, "GJ01AB1234", "Bike", 1 },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 0, "Active", "LIC002", 5, null, 0.0, "Available", 0, 0m, 1, "GJ02CD5678", "Scooter", 2 }
                });

            migrationBuilder.InsertData(
                table: "Orders",
                columns: new[] { "OrderId", "CancelledReason", "CreatedAt", "CustomerId", "DeliveredDate", "DeliveryCharge", "EstimatedDeliveryDate", "FinalAmount", "ModifiedAt", "OrderDate", "OrderNumber", "PaymentMode", "Status", "TotalAmount", "TrackingNumber" },
                values: new object[,]
                {
                    { 1, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 1, null, 20m, null, 260m, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Cash", "Pending", 240m, null },
                    { 2, null, new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), 2, null, 10m, null, 100m, null, new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "UPI", "Confirmed", 90m, null }
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "ProductId", "Brand", "CategoryId", "CreatedAt", "CurrentStock", "Description", "ImageUrl", "IsActive", "IsFeatured", "LowStockValue", "ModifiedAt", "Name", "Price", "StoreOwnerId", "SubCategoryId" },
                values: new object[,]
                {
                    { 1, "Local", 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 100, "Default Description", "apple.jpg", true, false, 10, null, "Apple", 120m, 1, 1 },
                    { 2, "Farm", 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 200, "Default Description", "potato.jpg", true, false, 20, null, "Potato", 30m, 2, 2 }
                });

            migrationBuilder.InsertData(
                table: "StoreProfiles",
                columns: new[] { "StoreId", "Address", "ClosingTime", "CreatedAt", "DeliveryRadiusKm", "Description", "Email", "Gstnumber", "ModifiedAt", "OpeningTime", "OwnerId", "Phone", "StoreName" },
                values: new object[,]
                {
                    { 1, "Ahmedabad", new TimeSpan(0, 22, 0, 0, 0), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 10.0, "Groceries", "fresh@shop.com", "GST111", null, new TimeSpan(0, 9, 0, 0, 0), 1, "9999999999", "Fresh Mart" },
                    { 2, "Surat", new TimeSpan(0, 21, 0, 0, 0), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 8.0, "Vegetables", "veg@shop.com", "GST222", null, new TimeSpan(0, 8, 0, 0, 0), 2, "8888888888", "Veg Hub" }
                });

            migrationBuilder.InsertData(
                table: "CartItems",
                columns: new[] { "CartItemId", "CartId", "CreatedAt", "ModifiedAt", "ProductId", "Quantity" },
                values: new object[,]
                {
                    { 1, 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 1, 2 },
                    { 2, 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 2, 3 }
                });

            migrationBuilder.InsertData(
                table: "DeliveryStaffAssignments",
                columns: new[] { "AssignmentId", "AssignedDate", "CreatedAt", "DeliveryStaffStaffId", "ModifiedAt", "Note", "OrderId", "StaffId", "Status" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, 1, 1, "Assigned" },
                    { 2, new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, 2, 2, "Assigned" }
                });

            migrationBuilder.InsertData(
                table: "Feedbacks",
                columns: new[] { "FeedbackId", "Comment", "CreatedAt", "FeedbackTargetType", "ModifiedAt", "OrderId", "ProductId", "Rating", "UserId" },
                values: new object[,]
                {
                    { 1, "Excellent service", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Order", null, 1, null, 5, 9 },
                    { 2, "Good quality", new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), "Product", null, null, 2, 4, 10 }
                });

            migrationBuilder.InsertData(
                table: "OrderItems",
                columns: new[] { "OrderItemId", "CreatedAt", "ModifiedAt", "OrderId", "ProductId", "Quantity", "TotalPrice", "UnitPrice" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 1, 1, 2, 240m, 120m },
                    { 2, new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 2, 2, 3, 90m, 30m }
                });

            migrationBuilder.InsertData(
                table: "OrderTrackingHistories",
                columns: new[] { "TrackingId", "CreatedAt", "Location", "ModifiedAt", "Note", "OrderId", "Status", "StatusTime" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, 1, "Order Placed", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 2, new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, 2, "Delivered", new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified) }
                });

            migrationBuilder.InsertData(
                table: "Payments",
                columns: new[] { "PaymentId", "AmountPaid", "CreatedAt", "ModifiedAt", "OrderId", "PaymentDate", "PaymentMode", "Status", "TransactionId" },
                values: new object[,]
                {
                    { 1, 260m, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Cash", "Paid", null },
                    { 2, 100m, new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 2, new DateTime(2025, 1, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), "UPI", "Paid", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "CartItems",
                keyColumn: "CartItemId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "CartItems",
                keyColumn: "CartItemId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "DeliveryStaffAssignments",
                keyColumn: "AssignmentId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "DeliveryStaffAssignments",
                keyColumn: "AssignmentId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Feedbacks",
                keyColumn: "FeedbackId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Feedbacks",
                keyColumn: "FeedbackId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "OrderItems",
                keyColumn: "OrderItemId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "OrderItems",
                keyColumn: "OrderItemId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "OrderTrackingHistories",
                keyColumn: "TrackingId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "OrderTrackingHistories",
                keyColumn: "TrackingId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Payments",
                keyColumn: "PaymentId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Payments",
                keyColumn: "PaymentId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "StoreProfiles",
                keyColumn: "StoreId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "StoreProfiles",
                keyColumn: "StoreId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Carts",
                keyColumn: "CartId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Carts",
                keyColumn: "CartId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "DeliveryStaffs",
                keyColumn: "StaffId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "DeliveryStaffs",
                keyColumn: "StaffId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Orders",
                keyColumn: "OrderId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Orders",
                keyColumn: "OrderId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "ProductId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "ProductId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "StoreOwners",
                keyColumn: "StoreOwnerId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "StoreOwners",
                keyColumn: "StoreOwnerId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Zones",
                keyColumn: "ZoneId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Zones",
                keyColumn: "ZoneId",
                keyValue: 2);
        }
    }
}
