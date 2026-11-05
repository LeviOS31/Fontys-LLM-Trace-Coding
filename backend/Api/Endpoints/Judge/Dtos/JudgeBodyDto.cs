namespace Api.Endpoints.Judge.Dtos
{
    public class JudgeBodyDto
    {
        public required List<Guid> JudgeTemplateIds { get; set; }
        public Guid[]? TraceCollectionIds { get; init; }
    }
}
