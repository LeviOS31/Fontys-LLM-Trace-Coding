using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using JudgeTemplates.Feature.UpdateJudgeTemplate;
using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Shared;
using Shouldly;

namespace JudgeTemplates.Tests.Features.UpdateJudgeTemplate;

public class UpdateJudgeTemplateHandlerTests
{
    [Fact]
    public async Task WhenTemplateHasNoVersions_SaveEditedContentAsVersionTwo()
    {
        var projectId = Guid.NewGuid();
        var projectVersionId = Guid.NewGuid();
        var judgeTemplateId = Guid.NewGuid();
        var axialCodeId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var template = new JudgeTemplate
        {
            JudgeTemplateId = judgeTemplateId,
            JudgeTemplateName = "Test template",
            JudgeTemplateDescription = "Test description",
            AxialCodeId = axialCodeId,
            ProjectId = projectId,
            ProjectVersionId = projectVersionId,
            IsDeprecated = true,
        };
        var judgeTemplateSet = new List<JudgeTemplate> { template }.BuildMockDbSet();
        var versionSet = new List<JudgeTemplateVersion>().BuildMockDbSet();
        var dbContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        dbContext.JudgeTemplates.Returns(judgeTemplateSet);
        dbContext.Set<JudgeTemplateVersion>().Returns(versionSet);
        dbContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mediator = Substitute.For<IMediator>();
        Result<InternalGetAllAxialCodesByVersionResponse> axialCodesResponse =
            new InternalGetAllAxialCodesByVersionResponse
            {
                AxialCodes =
                [
                    new InternalGetAllAxialCodesByVersionResponse.AxialCodeEntry
                    {
                        AxialCodeId = axialCodeId,
                        Label = "Test axial code",
                        Description = "Test behavior",
                        IsActive = true,
                        TraceIds = [],
                    },
                ],
            };
        mediator
            .Send(Arg.Any<InternalGetAllAxialCodesByVersionRequest>(), Arg.Any<CancellationToken>())
            .Returns(axialCodesResponse);

        var handler = new UpdateJudgeTemplateHandler(dbContext, mediator);
        var request = new UpdateJudgeTemplateRequest
        {
            UserId = userId,
            ProjectId = projectId,
            ProjectVersionId = projectVersionId,
            JudgeTemplateId = judgeTemplateId,
            Content = "Updated content",
        };

        var result = await handler.Handle(request, CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        template.CustomJudgeTemplateContent.ShouldBe("Updated content");
        template.CurrentVersionNumber.ShouldBe(2);
        template.IsDeprecated.ShouldBeFalse();
        versionSet
            .Received(1)
            .Add(
                Arg.Is<JudgeTemplateVersion>(version =>
                    version.VersionNumber == 1 && version.Content.Contains("Test axial code")
                )
            );
        versionSet
            .Received(1)
            .Add(
                Arg.Is<JudgeTemplateVersion>(version =>
                    version.VersionNumber == 2 && version.Content == "Updated content"
                )
            );
        await dbContext.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
