using System.ComponentModel.DataAnnotations;

namespace Api.Endpoints.JudgeTemplates.Dtos;

public class CreateJudgeTemplateDto
{
    [MaxLength(255)]
    public required string Name { get; set; }

    [MaxLength(255)]
    public string? Description { get; set; }
}
