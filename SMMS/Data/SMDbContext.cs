using Microsoft.EntityFrameworkCore;
using SMMS.Models;

namespace SMMS.Data
{
    public class SMDbContext : DbContext
    {
        public SMDbContext(DbContextOptions<SMDbContext> options)
            : base(options)
        {
        }

        
        public DbSet<User> Users { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<StoreOwner> StoreOwners { get; set; }
        public DbSet<StoreProfile> StoreProfiles { get; set; }

        public DbSet<Category> Categories { get; set; }
        public DbSet<SubCategory> SubCategories { get; set; }
        public DbSet<Product> Products { get; set; }

        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }

        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderTrackingHistory> OrderTrackingHistories { get; set; }

        public DbSet<Payment> Payments { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }

        public DbSet<Zone> Zones { get; set; }
        public DbSet<DeliveryStaff> DeliveryStaffs { get; set; }
        public DbSet<DeliveryStaffAssignment> DeliveryStaffAssignments { get; set; }

        // Fluent API Configuration
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ---------- USER ----------
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // ---------- CUSTOMER ----------
            modelBuilder.Entity<Customer>()
                .HasOne(c => c.User)
                .WithMany(u => u.Customers)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // ---------- STORE OWNER ----------
            modelBuilder.Entity<StoreOwner>()
                .HasOne(so => so.User)
                .WithMany(u => u.StoreOwners)
                .HasForeignKey(so => so.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<StoreProfile>()
                .HasOne(sp => sp.Owner)
                .WithMany(so => so.StoreProfiles)
                .HasForeignKey(sp => sp.OwnerId)
                .OnDelete(DeleteBehavior.NoAction);

            // ---------- CATEGORY / SUBCATEGORY ----------
            modelBuilder.Entity<SubCategory>()
                .HasOne(sc => sc.Category)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(sc => sc.CategoryId)
                .OnDelete(DeleteBehavior.NoAction);

            // ---------- PRODUCT ----------
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.SubCategory)
                .WithMany(sc => sc.Products)
                .HasForeignKey(p => p.SubCategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.StoreOwner)
                .WithMany(so => so.Products)
                .HasForeignKey(p => p.StoreOwnerId)
                .OnDelete(DeleteBehavior.NoAction);

            // ---------- CART ----------
            modelBuilder.Entity<Cart>()
                .HasOne(c => c.Customer)
                .WithMany(cu => cu.Carts)
                .HasForeignKey(c => c.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Cart)
                .WithMany(c => c.CartItems)
                .HasForeignKey(ci => ci.CartId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Product)
                .WithMany(p => p.CartItems)
                .HasForeignKey(ci => ci.ProductId)
                .OnDelete(DeleteBehavior.NoAction);

            // ---------- ORDER ----------
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Customer)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<OrderTrackingHistory>()
                .HasOne(oth => oth.Order)
                .WithMany(o => o.OrderTrackingHistories)
                .HasForeignKey(oth => oth.OrderId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Order)
                .WithMany(o => o.Payments)
                .HasForeignKey(p => p.OrderId)
                .OnDelete(DeleteBehavior.NoAction);

            // ---------- FEEDBACK ----------
            modelBuilder.Entity<Feedback>()
                .HasOne(f => f.User)
                .WithMany(u => u.Feedbacks)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Feedback>()
                .HasOne(f => f.Order)
                .WithMany(o => o.Feedbacks)
                .HasForeignKey(f => f.OrderId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Feedback>()
                .HasOne(f => f.Product)
                .WithMany(p => p.Feedbacks)
                .HasForeignKey(f => f.ProductId)
                .OnDelete(DeleteBehavior.NoAction);

            // ---------- DELIVERY ----------
            modelBuilder.Entity<DeliveryStaff>()
                .HasOne(ds => ds.User)
                .WithMany(u => u.DeliveryStaffs)
                .HasForeignKey(ds => ds.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<DeliveryStaff>()
                .HasOne(ds => ds.Zone)
                .WithMany()
                .HasForeignKey(ds => ds.ZoneId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<DeliveryStaffAssignment>()
                .HasOne(dsa => dsa.DeliveryStaff)
                .WithMany()
                .HasForeignKey(dsa => dsa.StaffId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<DeliveryStaffAssignment>()
                .HasOne(dsa => dsa.Order)
                .WithMany(o => o.DeliveryStaffAssignments)
                .HasForeignKey(dsa => dsa.OrderId)
                .OnDelete(DeleteBehavior.NoAction);

            //-------------------------------------------category
            modelBuilder.Entity<Category>().HasData(
                new Category { CategoryId = 1, Name = "Groceries", IsActive = true, CreatedAt = new DateTime(2025, 1, 1) },
                new Category { CategoryId = 2, Name = "Electronics", IsActive = true, CreatedAt = new DateTime(2025, 1, 1) }
            );

            //-------------------------------------------sub category
            modelBuilder.Entity<SubCategory>().HasData(
                new SubCategory { SubCategoryId = 1, SubCategoryName = "Fruits", CategoryId = 1 },
                new SubCategory { SubCategoryId = 2, SubCategoryName = "Vegetables", CategoryId = 1 }
            );

            //-------------------------------------------ZONE 
            modelBuilder.Entity<Zone>().HasData(
                new Zone
                {ZoneId = 1, ZoneName = "North Zone", City = "Ahmedabad", State = "Gujarat", Country = "India",
                    PincodeNumber = 380001, IsActive = true, CreatedAt = new DateTime(2025, 1, 1) },
                new Zone
                {ZoneId = 2, ZoneName = "South Zone",  City = "Surat", State = "Gujarat", Country = "India",
                    PincodeNumber = 395003, IsActive = true, CreatedAt = new DateTime(2025, 1, 1)}
            );

            //-------------------------------------------USERS
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    UserName = "Store Owner",
                    Email = "owner@gmail.com",
                    Password = "Owner@123",
                    Phone = "9876543210",
                    Role = "StoreOwner",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new User
                {
                    UserId = 3,
                    UserName = "Delivery Staff",
                    Email = "staff@gmail.com",
                    Password = "password",
                    Phone = "9876543212",
                    Role = "DeliveryStaff",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new User
                {
                    UserId = 9,
                    UserName = "Customer User",
                    Email = "customer@gmail.com",
                    Password = "password",
                    Phone = "9876543211",
                    Role = "Customer",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new User
                {
                    UserId = 10,
                    UserName = "Customer Two",
                    Email = "customer2@gmail.com",
                    Password = "password",
                    Phone = "9876543213",
                    Role = "Customer",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new User
                {
                    UserId = 17,
                    UserName = "Shreeya",
                    Email = "shreeya@gmail.com",
                    Password = "password",
                    Phone = "9876549871",
                    Role = "StoreOwner",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1)
                }
            );

            //-------------------------------------------STORE OWNER
            modelBuilder.Entity<StoreOwner>().HasData(
                new StoreOwner { StoreOwnerId = 1, UserId = 1, CreatedAt = new DateTime(2025, 1, 1) },
                new StoreOwner { StoreOwnerId = 2, UserId = 3, CreatedAt = new DateTime(2025, 1, 1) }
            );

            //-------------------------------------------STORE PROFILE

            modelBuilder.Entity<StoreProfile>().HasData(
                new StoreProfile
                {StoreId = 1, StoreName = "Fresh Mart", OwnerId = 1, Address = "Ahmedabad", Phone = "9999999999",
                    Email = "fresh@shop.com", Description = "Groceries", DeliveryRadiusKm = 10, OpeningTime = new TimeSpan(9, 0, 0),
                    ClosingTime = new TimeSpan(22, 0, 0), Gstnumber = "GST111", CreatedAt = new DateTime(2025, 1, 1)
                },
                new StoreProfile
                {StoreId = 2, StoreName = "Veg Hub", OwnerId = 2, Address = "Surat",  Phone = "8888888888",
                    Email = "veg@shop.com",  Description = "Vegetables",  DeliveryRadiusKm = 8, OpeningTime = new TimeSpan(8, 0, 0),
                    ClosingTime = new TimeSpan(21, 0, 0),  Gstnumber = "GST222", CreatedAt = new DateTime(2025, 1, 1)
                }
            );

            //-------------------------------------------PRODUCT
            modelBuilder.Entity<Product>().HasData(
                new Product
                {
                    ProductId = 1,
                    Name = "Apple",
                    Brand = "Local",
                    CategoryId = 1,
                    SubCategoryId = 1,
                    StoreOwnerId = 1,
                    Price = 120,
                    ImageUrl = "apple.jpg",
                    CurrentStock = 100,
                    LowStockValue = 10,
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new Product
                {
                    ProductId = 2,
                    Name = "Potato",
                    Brand = "Farm",
                    CategoryId = 1,
                    SubCategoryId = 2,
                    StoreOwnerId = 2,
                    Price = 30,
                    ImageUrl = "potato.jpg",
                    CurrentStock = 200,
                    LowStockValue = 20,
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1)
                }
            );

            //-------------------------------------------CUSTOMER

            modelBuilder.Entity<Customer>().HasData(
                new Customer { CustomerId = 1, UserId = 9, City = "Ahmedabad", State = "Gujarat", CreatedAt = new DateTime(2025, 1, 1) },
                new Customer { CustomerId = 2, UserId = 10, City = "Surat", State = "Gujarat", CreatedAt = new DateTime(2025, 1, 1) }
            );

            //-------------------------------------------CART
            modelBuilder.Entity<Cart>().HasData(
                new Cart { CartId = 1, CustomerId = 1, CreatedAt = new DateTime(2025, 1, 1) },
                new Cart { CartId = 2, CustomerId = 2, CreatedAt = new DateTime(2025, 1, 1) }
            );

            //-------------------------------------------CART ITEM
            modelBuilder.Entity<CartItem>().HasData(
                new CartItem { CartItemId = 1, CartId = 1, ProductId = 1, Quantity = 2, CreatedAt = new DateTime(2025, 1, 1) },
                new CartItem { CartItemId = 2, CartId = 2, ProductId = 2, Quantity = 3, CreatedAt = new DateTime(2025, 1, 1) }
            );


            //-------------------------------------------ORDER
            modelBuilder.Entity<Order>().HasData(
                new Order
                {
                    OrderId = 1,
                    CustomerId = 1,
                    OrderDate = new DateTime(2025, 1, 1),
                    Status = "Pending",
                    PaymentMode = "Cash",
                    TotalAmount = 240,
                    DeliveryCharge = 20,
                    FinalAmount = 260,
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new Order
                {
                    OrderId = 2,
                    CustomerId = 2,
                    OrderDate = new DateTime(2025, 1, 2),
                    Status = "Confirmed",
                    PaymentMode = "UPI",
                    TotalAmount = 90,
                    DeliveryCharge = 10,
                    FinalAmount = 100,
                    CreatedAt = new DateTime(2025, 1, 2)
                }
            );

            //-------------------------------------------ORDER ITEM
            modelBuilder.Entity<OrderItem>().HasData(
                new OrderItem { OrderItemId = 1, OrderId = 1, ProductId = 1, Quantity = 2, UnitPrice = 120, TotalPrice = 240, CreatedAt = new DateTime(2025, 1, 1) },
                new OrderItem { OrderItemId = 2, OrderId = 2, ProductId = 2, Quantity = 3, UnitPrice = 30, TotalPrice = 90, CreatedAt = new DateTime(2025, 1, 2) }
            );

            //-------------------------------------------PAYMENT
            modelBuilder.Entity<Payment>().HasData(
                new Payment
                {
                    PaymentId = 1,
                    OrderId = 1,
                    AmountPaid = 260,
                    Status = "Paid",
                    PaymentMode = "Cash",
                    PaymentDate = new DateTime(2025, 1, 1),
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new Payment
                {
                    PaymentId = 2,
                    OrderId = 2,
                    AmountPaid = 100,
                    Status = "Paid",
                    PaymentMode = "UPI",
                    PaymentDate = new DateTime(2025, 1, 2),
                    CreatedAt = new DateTime(2025, 1, 2)
                }
            );

            //-------------------------------------------DELIVERY STAFF
            modelBuilder.Entity<DeliveryStaff>().HasData(
                new DeliveryStaff
                {
                    StaffId = 1,
                    UserId = 3,
                    ZoneId = 1,
                    VehicleType = "Bike",
                    VehicleNumber = "GJ01AB1234",
                    LicenseNumber = "LIC001",
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new DeliveryStaff
                {
                    StaffId = 2,
                    UserId = 1,
                    ZoneId = 2,
                    VehicleType = "Scooter",
                    VehicleNumber = "GJ02CD5678",
                    LicenseNumber = "LIC002",
                    CreatedAt = new DateTime(2025, 1, 1)
                }
            );

            //-------------------------------------------DELIVERY STAFF ASSIGNMENT
            modelBuilder.Entity<DeliveryStaffAssignment>().HasData(
                new DeliveryStaffAssignment
                {
                    AssignmentId = 1,
                    StaffId = 1,
                    OrderId = 1,
                    AssignedDate = new DateTime(2025, 1, 1),
                    Status = "Assigned",
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new DeliveryStaffAssignment
                {
                    AssignmentId = 2,
                    StaffId = 2,
                    OrderId = 2,
                    AssignedDate = new DateTime(2025, 1, 2),
                    Status = "Assigned",
                    CreatedAt = new DateTime(2025, 1, 2)
                }
            );

            //-------------------------------------------ORDER TRACKING HISTORY
            modelBuilder.Entity<OrderTrackingHistory>().HasData(
                new OrderTrackingHistory
                {
                    TrackingId = 1,
                    OrderId = 1,
                    Status = "Order Placed",
                    StatusTime = new DateTime(2025, 1, 1),
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new OrderTrackingHistory
                {
                    TrackingId = 2,
                    OrderId = 2,
                    Status = "Delivered",
                    StatusTime = new DateTime(2025, 1, 2),
                    CreatedAt = new DateTime(2025, 1, 2)
                }
            );

            //-------------------------------------------FEEDBACK
            modelBuilder.Entity<Feedback>().HasData(
                new Feedback
                {
                    FeedbackId = 1,
                    UserId = 9,
                    OrderId = 1,
                    Rating = 5,
                    Comment = "Excellent service",
                    FeedbackTargetType = "Order",
                    CreatedAt = new DateTime(2025, 1, 1)
                },
                new Feedback
                {
                    FeedbackId = 2,
                    UserId = 10,
                    ProductId = 2,
                    Rating = 4,
                    Comment = "Good quality",
                    FeedbackTargetType = "Product",
                    CreatedAt = new DateTime(2025, 1, 2)
                }
            );


        }
    }
}
