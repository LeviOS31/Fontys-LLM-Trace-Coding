using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Projects.Data.Models;
using AssessmentCriteriaModel = Projects.Data.Models.AssessmentCriteria;

namespace Projects.Data;

public class ProjectDbContext : DbContext
{
    public ProjectDbContext(DbContextOptions<ProjectDbContext> options)
        : base(options) { }

    public virtual DbSet<Project> Projects { get; set; }
    public virtual DbSet<AssessmentCriteriaModel> AssessmentCriterias { get; set; }
    public virtual DbSet<ProjectVersion> Versions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
