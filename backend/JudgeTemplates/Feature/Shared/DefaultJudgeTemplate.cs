using System.Reflection;
using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;

namespace JudgeTemplates.Feature.Shared;

/// <summary>
/// The default judge prompt, filled with an axial code's data. Used for every template the user has not edited.
/// </summary>
internal static class DefaultJudgeTemplate
{
    private static readonly Lazy<string> TemplateText = new(() =>
        LoadTemplate("JudgeTemplates.Resources.JudgeTemplate.EmptyJudgeTemplate.txt")
    );

    public static string Render(
        InternalGetAllAxialCodesByVersionResponse.AxialCodeEntry axialCode,
        string? templateContent = null
    )
    {
        // Axial codes generated before judge guidelines existed fall back to their behaviour description.
        var judgeGuidelines = string.IsNullOrWhiteSpace(axialCode.JudgeGuidelines)
            ? axialCode.Description
            : axialCode.JudgeGuidelines;

        return (templateContent ?? TemplateText.Value)
            .Replace("{{axial_code_name}}", axialCode.Label)
            .Replace("{{axial_code_judge_guidelines}}", judgeGuidelines)
            .Replace("{{example_positive_trace}}", axialCode.PositiveExampleTrace ?? string.Empty)
            .Replace("{{example_positive_reasoning}}", axialCode.PositiveExampleReasoning ?? string.Empty)
            .Replace("{{example_negative_trace}}", axialCode.NegativeExampleTrace ?? string.Empty)
            .Replace("{{example_negative_reasoning}}", axialCode.NegativeExampleReasoning ?? string.Empty);
    }

    private static string LoadTemplate(string resourceName)
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            throw new InvalidOperationException($"Template resource not found: {resourceName}");
        }
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
