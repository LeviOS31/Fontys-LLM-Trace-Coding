using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Contracts.Features.InternalGetJudgeTemplateByAxialCodeId;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Shared;
using Shouldly;

namespace JudgeTemplates.Tests.Features.InternalGetJudgeTemplateByAxialCodeId;

public class InternalGetJudgeTemplateByAxialCodeIdHandlerTests
{
    private static readonly Guid _projectId = new("2B1F0D44-6C2E-4D5A-9B8E-000000000001");
    private static readonly Guid _projectVersionId = new("2B1F0D44-6C2E-4D5A-9B8E-000000000002");
    private static readonly Guid _axialCodeId = new("2B1F0D44-6C2E-4D5A-9B8E-000000000003");
    private static readonly Guid _userId = new("2B1F0D44-6C2E-4D5A-9B8E-000000000004");

    private static InternalGetJudgeTemplateByAxialCodeIdHandler CreateHandler(
        string? judgeGuidelines,
        string? customContent = null
    )
    {
        var templates = new List<JudgeTemplate>
        {
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "Template",
                JudgeTemplateDescription = "Description",
                AxialCodeId = _axialCodeId,
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
                    AxialCodeId = _axialCodeId,
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

        return new InternalGetJudgeTemplateByAxialCodeIdHandler(mockContext, mediator);
    }

    private static InternalGetJudgeTemplateByAxialCodeIdRequest CreateRequest() =>
        new()
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            AxialCodeId = _axialCodeId,
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
        result.IsSuccess.ShouldBeTrue();
        result.Value.Content.ShouldContain("Fabricated policies");
        result.Value.Content.ShouldContain("Judging Guidelines:");
        result.Value.Content.ShouldContain("Mark true when: a policy is invented.");
        result.Value.Content.ShouldNotContain("Agent states policies that do not exist");
        result.Value.Content.ShouldNotContain("{{axial_code_judge_guidelines}}");
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
        result.Value.Content.ShouldContain("Agent states policies that do not exist");
        result.Value.Content.ShouldNotContain("{{axial_code_judge_guidelines}}");
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
        result.Value.Content.ShouldBe("My own judge prompt");
    }
}
