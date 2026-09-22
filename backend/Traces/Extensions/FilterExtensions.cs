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
        {
            var pattern = $"%{EscapeLikePattern(value ?? string.Empty)}%";

            return query.Where(t =>
                t.TraceScopes.Any(tc =>
                    tc.TraceScopeSpans.Any(tss =>
                        // 1. Match against Span Name
                        EF.Functions.ILike(tss.Name, pattern, "\\") ||

                        // 2. OR match against any Span Attribute Value
                        tss.SpanAttributes.Any(sa =>
                            EF.Functions.ILike(sa.Value, pattern, "\\")
                        )
                    )
                )
            );
        },

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
