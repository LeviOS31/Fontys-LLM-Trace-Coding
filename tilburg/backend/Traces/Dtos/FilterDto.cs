namespace Traces.Dtos;

public record FilterDto
{
    public string Key { get; init; } = string.Empty;
    public string? Value { get; init; }
    public List<string> Values { get; set; } = new(); // Not used, but already implemented for when we need to filter for example multiple axial codes
}
