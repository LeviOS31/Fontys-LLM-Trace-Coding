using System.Reflection;
using Microsoft.EntityFrameworkCore;
using ProjectVersions.Data.Models;

namespace ProjectVersions.Data;

public class ProjectVersionsDbContext : DbContext
{
    public ProjectVersionsDbContext(DbContextOptions<ProjectVersionsDbContext> options)
        : base(options) { }

    public virtual DbSet<ProjectVersion> Versions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
