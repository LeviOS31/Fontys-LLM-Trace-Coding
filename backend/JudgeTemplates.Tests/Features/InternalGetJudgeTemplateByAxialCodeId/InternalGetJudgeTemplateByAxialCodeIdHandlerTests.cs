using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Contracts.Features.InternalGetJudgeTemplates;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using JudgeTemplates.Feature.InternalGetJudgeTemplates;
using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Shared;
using Shouldly;

namespace JudgeTemplates.Tests.Features.InternalGetJudgeTemplates;

public class InternalGetJudgeTemplatesHandlerTests
{
    private static readonly Guid _projectId = new("2B1F0D44-6C2E-4D5A-9B8E-000000000001");
    private static readonly Guid _projectVersionId = new("2B1F0D44-6C2E-4D5A-9B8E-000000000002");
    private static readonly Guid[] _axialCodeIds = new[]
    {
        new Guid("2B1F0D44-6C2E-4D5A-9B8E-000000000003"),
    };

    private static readonly List<Guid> _judgetemplateids = new List<Guid> { Guid.NewGuid() };
    private static readonly Guid _userId = new("2B1F0D44-6C2E-4D5A-9B8E-000000000004");

    private static InternalGetJudgeTemplatesHandler CreateHandler(
        string? judgeGuidelines,
        string? customContent = null
    )
    {
        var templates = new List<JudgeTemplate>
        {
            new()
            {
                JudgeTemplateId = _judgetemplateids[0],
                JudgeTemplateName = "Template",
                JudgeTemplateDescription = "Description",
                AxialCodeId = _axialCodeIds[0],
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                CustomJudgeTemplateContent = customContent,
            },
        };
        var mockSet = templates.BuildMockDbSet();
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.JudgeTemplates.Returns(mockSet);

        Result<InternalGetAllAxialCodesByVersionResponse> axialCodes = new InternalGetAllAxialCodesByVersionResponse
        {
            AxialCodes =
            [
                new InternalGetAllAxialCodesByVersionResponse.AxialCodeEntry
                {
                    AxialCodeId = _axialCodeIds[0],
                    Label = "Fabricated policies",
                    Description = "Agent states policies that do not exist",
                    IsActive = true,
                    TraceIds = [],
                    JudgeGuidelines = judgeGuidelines,
                },
            ],
        };
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<InternalGetAllAxialCodesByVersionRequest>(), Arg.Any<CancellationToken>())
            .Returns(axialCodes);

        return new InternalGetJudgeTemplatesHandler(mockContext, mediator);
    }

    private static InternalGetJudgeTemplatesRequest CreateRequest() =>
        new()
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            judgeIds = _judgetemplateids.ToList(),
            UserId = _userId,
        };

    [Fact]
    public async Task WhenAxialCodeHasJudgeGuidelines_JudgeReceivesGuidelinesInsteadOfDescription()
    {
        // Arrange
        var handler = CreateHandler(
            "Mark true when: a policy is invented.\nMark false when: a real policy is quoted.\nBorderline cases: none."
        );

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        if (!result.IsSuccess)
        {
            var a = result.ErrorCode;
        }

        result.IsSuccess.ShouldBeTrue();
        result.Value.JudgeTemplates[0].Content.ShouldContain("Fabricated policies");
        result.Value.JudgeTemplates[0].Content.ShouldContain("Judging Guidelines:");
        result.Value.JudgeTemplates[0].Content.ShouldContain("Mark true when: a policy is invented.");
        result.Value.JudgeTemplates[0].Content.ShouldNotContain("Agent states policies that do not exist");
        result.Value.JudgeTemplates[0].Content.ShouldNotContain("{{axial_code_judge_guidelines}}");
    }

    [Fact]
    public async Task WhenAxialCodeHasNoJudgeGuidelines_JudgeReceivesDescription()
    {
        // Arrange
        var handler = CreateHandler(judgeGuidelines: null);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.JudgeTemplates[0].Content.ShouldContain("Agent states policies that do not exist");
        result.Value.JudgeTemplates[0].Content.ShouldNotContain("{{axial_code_judge_guidelines}}");
    }

    [Fact]
    public async Task WhenTemplateWasEditedByUser_JudgeReceivesEditedContentUnchanged()
    {
        // Arrange
        var handler = CreateHandler("Mark true when: a policy is invented.", customContent: "My own judge prompt");

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.JudgeTemplates[0].Content.ShouldBe("My own judge prompt");
    }
}
