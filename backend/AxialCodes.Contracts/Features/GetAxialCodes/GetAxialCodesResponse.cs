namespace AxialCodes.Contracts.Features.GetAxialCodes;

public record GetAxialCodesResponse
{
    public required DateTimeOffset? CreatedAt { get; init; }
    public required IEnumerable<AxialCodeViewModel>? AxialCodes { get; init; }
}
