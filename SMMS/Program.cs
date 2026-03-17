using Microsoft.EntityFrameworkCore;
using SMMS.Data;
using FluentValidation;
using SMMS.Validator;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Http.Features;
using SMMS.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Handle circular references in JSON serialization
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "SMMS API", 
        Version = "v1",
        Description = "Store Management System API with JWT Authentication"
    });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false; // Set to true in production
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "SMMS",
        ValidAudience = jwtSettings["Audience"] ?? "SMMS-Users",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    // Add role-based policies
    options.AddPolicy("CustomerOnly", policy => policy.RequireRole("Customer"));
    options.AddPolicy("StoreOwnerOnly", policy => policy.RequireRole("StoreOwner"));
    options.AddPolicy("DeliveryStaffOnly", policy => policy.RequireRole("DeliveryStaff"));
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    
    // Combined policies
    options.AddPolicy("StoreOwnerOrAdmin", policy => 
        policy.RequireRole("StoreOwner", "Admin"));
    options.AddPolicy("CustomerOrStoreOwner", policy => 
        policy.RequireRole("Customer", "StoreOwner"));
});

// File service and upload limits
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 15 * 1024 * 1024; // 15 MB
});

builder.Services.AddDbContext<SMDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("ConnectionString")
    ));

#region CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", p =>
    {
        p.WithOrigins(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:5173",
            "http://localhost:5174",
            "https://localhost:3000",
            "https://localhost:3001",
            "https://localhost:3002",
            "https://freshmart-frontend.onrender.com" // Update this once you have your frontend URL
        )
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials();
    });
    // In Development, allow any localhost origin to avoid port mismatch issues
    options.AddPolicy("AllowLocalhostDev", p =>
    {
        // Broad dev policy: allow any origin to avoid preflight issues during development
        p.SetIsOriginAllowed(_ => true)
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials();
    });
});
#endregion

ValidatorOptions.Global.DefaultRuleLevelCascadeMode = CascadeMode.Stop;

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseStaticFiles(); // serve files from wwwroot (for uploaded images)

// Enable Swagger in all environments for testing deployment
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SMMS API V1");
    c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
});

if (app.Environment.IsDevelopment())
{
    // development specific logic if any
}

// Explicit routing for correct CORS ordering
app.UseRouting();

// CORS (must be after routing and before auth)
if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowLocalhostDev");
}
else
{
    app.UseCors("AllowReact");
}

// Avoid dev preflight failures caused by automatic HTTPS redirects
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
