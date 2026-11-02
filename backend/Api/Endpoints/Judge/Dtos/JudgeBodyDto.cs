namespace Api.Endpoints.Judge.Dtos
{
    public class JudgeBodyDto
    {
        public required Guid[] AxialCodeIds { get; set; }
        public Guid[]? TraceCollectionIds { get; init; }
    }
}
