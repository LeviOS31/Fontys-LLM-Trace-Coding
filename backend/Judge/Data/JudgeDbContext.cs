using System.Reflection;
using Judge.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Judge.Data;

public class JudgeDbContext : DbContext
{
    public JudgeDbContext(DbContextOptions<JudgeDbContext> options)
        : base(options) { }

    public virtual DbSet<JudgeRun> JudgeRuns { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
