using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Traces.Data.Models;

namespace Traces.Data;

public class TracesDbContext : DbContext
{
    public TracesDbContext(DbContextOptions<TracesDbContext> options)
        : base(options) { }

    public virtual DbSet<SpanAttribute> SpanAttributes { get; set; }
    public virtual DbSet<SpanEvent> SpanEvent { get; set; }
    public virtual DbSet<SpanEventAttribute> SpanEventAttributes { get; set; }
    public virtual DbSet<Trace> Traces { get; set; }
    public virtual DbSet<TraceCollection> TraceCollections { get; set; }
    public virtual DbSet<TraceGroup> TraceGroups { get; set; }
    public virtual DbSet<TraceResource> TraceResources { get; set; }
    public virtual DbSet<TraceScope> TraceScopes { get; set; }
    public virtual DbSet<TraceScopeSpan> TraceScopeSpans { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
