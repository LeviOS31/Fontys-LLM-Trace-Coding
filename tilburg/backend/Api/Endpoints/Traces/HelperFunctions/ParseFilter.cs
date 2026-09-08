using Traces.Dtos;

namespace Api.Endpoints.Traces.HelperFunctions;

public static class Parsers
{
    public static FilterDto? ParseFilter(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        var parts = raw.Split(':', 2);
        if ((parts.Length != 2 && parts.Length != 1))
            return null;

        var key = parts[0];
        string[] values = [];
        if (parts.Length > 1)
        {
            var valuePart = parts[1];
            values = valuePart.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }

        return new FilterDto
        {
            Key = key,
            Value = values.Length == 1 ? values[0] : null,
            Values = values.Length > 1 ? values.ToList() : new List<string>(),
        };
    }
}
