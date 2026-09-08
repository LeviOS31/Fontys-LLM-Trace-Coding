using JudgeTemplates.Contracts.Features.SetAllJudgeTemplatesToDeprecated;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using JudgeTemplates.Feature.SetAllJudgeTemplatesToDeprecated;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Shared;
using Shouldly;

namespace JudgeTemplates.Tests.Features.SetAllJudgeTemplatesToDeprecated;

public class SetAllJudgeTemplatesToDeprecatedHandlerTests
{
    private static readonly Guid _projectId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _projectVersionId = new("68DF6625-60EA-4E0A-8F29-29DE14197025");

    private static SetAllJudgeTemplatesToDeprecatedRequest CreateRequest() =>
        new() { ProjectId = _projectId, ProjectVersionId = _projectVersionId };

    [Fact]
    public async Task WhenRequestIsValid_DeprecateAllMatchingTemplates()
    {
        // Arrange
        var templates = new List<JudgeTemplate>
        {
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "Template A",
                JudgeTemplateDescription = "Desc A",
                AxialCodeId = Guid.NewGuid(),
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                IsDeprecated = false,
            },
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "Template B",
                JudgeTemplateDescription = "Desc B",
                AxialCodeId = Guid.NewGuid(),
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                IsDeprecated = false,
            },
        };

        var mockSet = templates.BuildMockDbSet();
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.JudgeTemplates.Returns(mockSet);

        var handler = new SetAllJudgeTemplatesToDeprecatedHandler(mockContext);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        templates.ShouldAllBe(t => t.IsDeprecated);
    }

    [Fact]
    public async Task WhenNoTemplatesMatchProjectVersion_ReturnSuccess()
    {
        // Arrange
        var differentVersionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197099");
        var templates = new List<JudgeTemplate>
        {
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "Template A",
                JudgeTemplateDescription = "Desc A",
                AxialCodeId = Guid.NewGuid(),
                ProjectId = _projectId,
                ProjectVersionId = differentVersionId,
                IsDeprecated = false,
            },
        };

        var mockSet = templates.BuildMockDbSet();
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.JudgeTemplates.Returns(mockSet);

        var handler = new SetAllJudgeTemplatesToDeprecatedHandler(mockContext);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        templates[0].IsDeprecated.ShouldBeFalse();
    }

    [Fact]
    public async Task WhenDatabaseThrowsDbUpdateException_ReturnDatabaseError()
    {
        // Arrange
        var templates = new List<JudgeTemplate>
        {
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "Template A",
                JudgeTemplateDescription = "Desc A",
                AxialCodeId = Guid.NewGuid(),
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                IsDeprecated = false,
            },
        };

        var mockSet = templates.BuildMockDbSet();
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.JudgeTemplates.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new DbUpdateException());

        var handler = new SetAllJudgeTemplatesToDeprecatedHandler(mockContext);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenDatabaseThrowsNpgsqlException_ReturnDatabaseError()
    {
        // Arrange
        var templates = new List<JudgeTemplate>
        {
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "Template A",
                JudgeTemplateDescription = "Desc A",
                AxialCodeId = Guid.NewGuid(),
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                IsDeprecated = false,
            },
        };

        var mockSet = templates.BuildMockDbSet();
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.JudgeTemplates.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new NpgsqlException());

        var handler = new SetAllJudgeTemplatesToDeprecatedHandler(mockContext);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenAlreadyDeprecatedTemplatesExist_StillReturnSuccess()
    {
        // Arrange
        var templates = new List<JudgeTemplate>
        {
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "Already Deprecated",
                JudgeTemplateDescription = "Desc",
                AxialCodeId = Guid.NewGuid(),
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                IsDeprecated = true,
            },
        };

        var mockSet = templates.BuildMockDbSet();
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.JudgeTemplates.Returns(mockSet);

        var handler = new SetAllJudgeTemplatesToDeprecatedHandler(mockContext);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        templates[0].IsDeprecated.ShouldBeTrue();
    }
}
