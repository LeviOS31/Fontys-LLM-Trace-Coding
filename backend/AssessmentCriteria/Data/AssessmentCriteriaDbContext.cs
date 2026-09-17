using System.Reflection;
using AssessmentCriteria.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace AssessmentCriteria.Data;

public class AssessmentCriteriaDbContext : DbContext
{
    public AssessmentCriteriaDbContext(DbContextOptions<AssessmentCriteriaDbContext> options)
        : base(options) { }

    public DbSet<AssessmentCriterion> AssessmentCriteria => Set<AssessmentCriterion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
