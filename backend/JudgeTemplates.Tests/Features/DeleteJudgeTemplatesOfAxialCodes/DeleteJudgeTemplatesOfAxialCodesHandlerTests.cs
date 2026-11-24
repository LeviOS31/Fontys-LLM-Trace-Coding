using JudgeTemplates.Contracts.Features.DeleteJudgeTemplatesOfAxialCodes;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using JudgeTemplates.Feature.DeleteJudgeTemplatesOfAxialCodes;
using Microsoft.EntityFrameworkCore;
using Shouldly;

namespace JudgeTemplates.Tests.Features.DeleteJudgeTemplatesOfAxialCodes;

public class DeleteJudgeTemplatesOfAxialCodesHandlerTests
{
    private static readonly Guid _projectId = new("7A0C1E52-3B4D-4E5F-8A9B-000000000001");
    private static readonly Guid _projectVersionId = new("7A0C1E52-3B4D-4E5F-8A9B-000000000002");
    private static readonly Guid _oldAxialCodeId = new("7A0C1E52-3B4D-4E5F-8A9B-000000000003");
    private static readonly Guid _keptAxialCodeId = new("7A0C1E52-3B4D-4E5F-8A9B-000000000004");

    private static DbContextOptions<JudgeTemplatesDbContext> CreateOptions() =>
        new DbContextOptionsBuilder<JudgeTemplatesDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    private static JudgeTemplate CreateTemplate(Guid axialCodeId, Guid? projectVersionId = null) =>
        new()
        {
            JudgeTemplateId = Guid.NewGuid(),
            JudgeTemplateName = "Template",
            JudgeTemplateDescription = "Description",
            AxialCodeId = axialCodeId,
            ProjectId = _projectId,
            ProjectVersionId = projectVersionId ?? _projectVersionId,
            IsDeprecated = true,
        };

    private static DeleteJudgeTemplatesOfAxialCodesRequest CreateRequest() =>
        new()
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            AxialCodeIds = [_oldAxialCodeId],
        };

    [Fact]
    public async Task WhenTemplatesBelongToDeletedAxialCodes_DeleteTemplatesAndTheirVersions()
    {
        // Arrange
        var options = CreateOptions();
        var oldTemplate = CreateTemplate(_oldAxialCodeId);
        var keptTemplate = CreateTemplate(_keptAxialCodeId);
        await using (var seedContext = new JudgeTemplatesDbContext(options))
        {
            seedContext.JudgeTemplates.AddRange(oldTemplate, keptTemplate);
            seedContext.JudgeTemplateVersions.AddRange(
                new JudgeTemplateVersion
                {
                    JudgeTemplateVersionId = Guid.NewGuid(),
                    JudgeTemplateId = oldTemplate.JudgeTemplateId,
                    VersionNumber = 1,
                    Content = "Old content",
                    CreatedAt = DateTimeOffset.UtcNow,
                },
                new JudgeTemplateVersion
                {
                    JudgeTemplateVersionId = Guid.NewGuid(),
                    JudgeTemplateId = keptTemplate.JudgeTemplateId,
                    VersionNumber = 1,
                    Content = "Kept content",
                    CreatedAt = DateTimeOffset.UtcNow,
                }
            );
            await seedContext.SaveChangesAsync();
        }

        await using var context = new JudgeTemplatesDbContext(options);
        var handler = new DeleteJudgeTemplatesOfAxialCodesHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var remainingTemplate = (await context.JudgeTemplates.ToListAsync()).ShouldHaveSingleItem();
        remainingTemplate.JudgeTemplateId.ShouldBe(keptTemplate.JudgeTemplateId);
        var remainingVersion = (await context.JudgeTemplateVersions.ToListAsync()).ShouldHaveSingleItem();
        remainingVersion.JudgeTemplateId.ShouldBe(keptTemplate.JudgeTemplateId);
    }

    [Fact]
    public async Task WhenTemplateBelongsToAnotherVersion_KeepIt()
    {
        // Arrange
        var options = CreateOptions();
        await using (var seedContext = new JudgeTemplatesDbContext(options))
        {
            seedContext.JudgeTemplates.Add(CreateTemplate(_oldAxialCodeId, projectVersionId: Guid.NewGuid()));
            await seedContext.SaveChangesAsync();
        }

        await using var context = new JudgeTemplatesDbContext(options);
        var handler = new DeleteJudgeTemplatesOfAxialCodesHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        (await context.JudgeTemplates.CountAsync()).ShouldBe(1);
    }

    [Fact]
    public async Task WhenNoTemplatesMatch_ReturnSuccess()
    {
        // Arrange
        await using var context = new JudgeTemplatesDbContext(CreateOptions());
        var handler = new DeleteJudgeTemplatesOfAxialCodesHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
    }
}
