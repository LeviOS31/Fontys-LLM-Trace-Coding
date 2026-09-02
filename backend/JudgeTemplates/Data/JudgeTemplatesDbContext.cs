using System.Reflection;
using JudgeTemplates.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace JudgeTemplates.Data;

public class JudgeTemplatesDbContext : DbContext
{
    public JudgeTemplatesDbContext(DbContextOptions<JudgeTemplatesDbContext> options)
        : base(options) { }

    public virtual DbSet<JudgeTemplate> JudgeTemplates { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
