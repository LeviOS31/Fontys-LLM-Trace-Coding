namespace Api.Endpoints.RawLLMData.Dtos
{
    public class ImportRawLLMDataDto
    {
        public required string Name { get; init; }
        public required IFormFile File { get; init; }
    }
}
