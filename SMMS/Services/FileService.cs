using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace SMMS.Services
{
    public interface IFileService
    {
        Task<string> UploadFileAsync(IFormFile file, string subFolder);
        void DeleteFile(string? relativePath);
    }

    public class FileService : IFileService
    {
        private readonly string _basePath;
        private readonly string _webRoot;
        private readonly string _uploadsFolder = "uploads";

        public FileService(Microsoft.AspNetCore.Hosting.IWebHostEnvironment env)
        {
            _webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            if (!Directory.Exists(_webRoot))
                Directory.CreateDirectory(_webRoot);
            _basePath = Path.Combine(_webRoot, _uploadsFolder);
            Directory.CreateDirectory(_basePath);
        }

        public async Task<string> UploadFileAsync(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                throw new ArgumentException($"Invalid file type. Allowed: {string.Join(", ", allowedExtensions)}");

            var folderPath = Path.Combine(_basePath, subFolder);
            Directory.CreateDirectory(folderPath);

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(folderPath, fileName);

            await using (var stream = File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            // return relative path (e.g., uploads/products/abc.jpg)
            return Path.Combine(_uploadsFolder, subFolder, fileName).Replace("\\", "/");
        }

        public void DeleteFile(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return;
            var clean = relativePath.TrimStart('\\', '/').Replace("\\", "/");
            if (clean.StartsWith("uploads/")) clean = clean.Substring(8);
            var fullPath = Path.Combine(_basePath, clean);
            if (File.Exists(fullPath))
            {
                try
                {
                    File.Delete(fullPath);
                }
                catch
                {
                    // swallow delete errors to not block main flow
                }
            }
        }
    }
}
