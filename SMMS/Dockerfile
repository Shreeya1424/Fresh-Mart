# Use the official .NET 8 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy the project file and restore dependencies
COPY ["SMMS.csproj", "./"]
RUN dotnet restore "./SMMS.csproj"

# Copy the remaining files and build the project
COPY . .
RUN dotnet build "SMMS.csproj" -c Release -o /app/build

# Publish the project
FROM build AS publish
RUN dotnet publish "SMMS.csproj" -c Release -o /app/publish

# Use the official .NET 8 runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create uploads directory and set permissions
RUN mkdir -p /app/wwwroot/uploads/products && chmod -R 777 /app/wwwroot/uploads

# Expose the port Render uses
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "SMMS.dll"]
