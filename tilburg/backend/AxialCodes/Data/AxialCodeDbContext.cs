using System.Reflection;
using AxialCodes.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace AxialCodes.Data;

public class AxialCodeDbContext : DbContext
{
    public AxialCodeDbContext(DbContextOptions<AxialCodeDbContext> options)
        : base(options) { }

    public virtual DbSet<AxialCodingResult> AxialCodingResults { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
