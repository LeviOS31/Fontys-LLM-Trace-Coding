using Microsoft.EntityFrameworkCore;
using Traces.Data.Models;
using Traces.Dtos;

namespace Traces.Extensions;

public static class FilterExtensions
{
    private static readonly Dictionary<string, Func<IQueryable<Trace>, string?, IQueryable<Trace>>> Filters = new(
        StringComparer.OrdinalIgnoreCase
    )
    {
        ["search"] = (query, value) =>
            query.Where(t =>
                t.TraceScopes.Any(tc =>
                    tc.TraceScopeSpans.Any(tss =>
                        tss.SpanAttributes.Any(sa =>
                            EF.Functions.ILike(sa.Value, $"%{EscapeLikePattern(value ?? string.Empty)}%", "\\")
                        )
                    )
                )
            ),

        ["traceCollection"] = (query, value) =>
            Guid.TryParse(value, out var traceCollectionId)
                ? query.Where(t => t.TraceCollectionId == traceCollectionId)
                : query,

        ["hasNoOpenCode"] = (query, _) => query.Where(t => (t.OpenCode == null)),
    };

    public static IQueryable<Trace> ApplyFilters(this IQueryable<Trace> query, List<FilterDto> filters)
    {
        foreach (var filterDto in filters)
        {
            if (string.IsNullOrWhiteSpace(filterDto.Key))
                continue;

            var key = filterDto.Key.Trim();
            if (Filters.TryGetValue(key, out var apply))
            {
                query = apply(query, filterDto.Value);
            }
        }
        return query;
    }

    public static string EscapeLikePattern(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        return input.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
    }
}
