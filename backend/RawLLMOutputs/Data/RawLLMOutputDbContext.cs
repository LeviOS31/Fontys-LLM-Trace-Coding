using System.Reflection;
using Microsoft.EntityFrameworkCore;
using RawLLMOutputs.Data.Models;

namespace RawLLMOutputs.Data
{
    public class RawLLMOutputDbContext : DbContext
    {
        public RawLLMOutputDbContext(DbContextOptions<RawLLMOutputDbContext> options)
            : base(options) { }

        public virtual DbSet<RawLLMOutput> RawLLMOutputs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
            base.OnModelCreating(modelBuilder);
        }
    }
}
