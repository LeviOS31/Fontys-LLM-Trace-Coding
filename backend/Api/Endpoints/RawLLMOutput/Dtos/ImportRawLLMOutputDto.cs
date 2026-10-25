namespace Api.Endpoints.RawLLMOutput.Dtos
{
    public class ImportRawLLMOutputDto
    {
        public required string Name { get; init; }
        public required IFormFile File { get; init; }
    }
}
