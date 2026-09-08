using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using JudgeTemplates.Feature.GetJudgeTemplates;
using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Shared;
using Shouldly;

namespace JudgeTemplates.Tests.Features.GetAllJudgeTemplates;

public class GetAllJudgeTemplateHandlerTests
{
    private static readonly Guid _projectId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _projectVersionId = new("68DF6625-60EA-4E0A-8F29-29DE14197025");
    private static readonly Guid _axialCodeId = new("68DF6625-60EA-4E0A-8F29-29DE14197026");
    private static readonly Guid _userId = new("CE97539F-4189-44FC-A87F-CFA3EDB177ED");

    private static IMediator CreateMediatorMock(
        ErrorCode? errorCode = null,
        IEnumerable<InternalGetAllAxialCodesByVersionResponse.AxialCodeEntry>? axialCodes = null
    )
    {
        var mediator = Substitute.For<IMediator>();
        Result<InternalGetAllAxialCodesByVersionResponse> result = errorCode is null
            ? new InternalGetAllAxialCodesByVersionResponse
            {
                AxialCodes =
                    axialCodes
                    ??
                    [
                        new InternalGetAllAxialCodesByVersionResponse.AxialCodeEntry
                        {
                            AxialCodeId = _axialCodeId,
                            Label = "Test Label",
                            Description = "Test Description",
                            IsActive = true,
                        },
                    ],
            }
            : errorCode.Value;

        mediator
            .Send(Arg.Any<InternalGetAllAxialCodesByVersionRequest>(), Arg.Any<CancellationToken>())
            .Returns(result);
        return mediator;
    }

    private static GetAllJudgeTemplateRequest CreateRequest() =>
        new()
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            UserId = _userId,
        };

    [Fact]
    public async Task WhenRequestIsValid_ReturnTemplatesWithFilledInText()
    {
        // Arrange
        var templates = new List<JudgeTemplate>
        {
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "My Template",
                JudgeTemplateDescription = "A description",
                AxialCodeId = _axialCodeId,
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

        var handler = new GetAllJudgeTemplateHandler(mockContext, CreateMediatorMock());

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var judgeTemplates = result.Value!.JudgeTemplates.ToList();
        judgeTemplates.Count.ShouldBe(1);

        var vm = judgeTemplates[0];
        vm.Name.ShouldBe("My Template");
        vm.Description.ShouldBe("A description");
        vm.IsDeprecated.ShouldBeFalse();
        vm.Template.ShouldContain("Test Label");
        vm.Template.ShouldContain("Test Description");
        vm.Template.ShouldNotContain("{{axial_code_name}}");
        vm.Template.ShouldNotContain("{{axial_code_description}}");
    }

    [Fact]
    public async Task WhenAxialCodeValidationFails_ReturnError()
    {
        // Arrange
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );

        var handler = new GetAllJudgeTemplateHandler(mockContext, CreateMediatorMock(ErrorCode.EntityNotFound));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenNoTemplatesExist_ReturnEmptyList()
    {
        // Arrange
        var mockSet = new List<JudgeTemplate>().BuildMockDbSet();
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.JudgeTemplates.Returns(mockSet);

        var handler = new GetAllJudgeTemplateHandler(mockContext, CreateMediatorMock());

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeTemplates.ShouldBeEmpty();
    }

    [Fact]
    public async Task WhenMultipleTemplatesExist_ReturnAllTemplates()
    {
        // Arrange
        var axialCodeId2 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197027");
        var axialCodes = new List<InternalGetAllAxialCodesByVersionResponse.AxialCodeEntry>
        {
            new()
            {
                AxialCodeId = _axialCodeId,
                Label = "Label A",
                Description = "Desc A",
                IsActive = true,
            },
            new()
            {
                AxialCodeId = axialCodeId2,
                Label = "Label B",
                Description = "Desc B",
                IsActive = true,
            },
        };

        var templates = new List<JudgeTemplate>
        {
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "Template A",
                JudgeTemplateDescription = "Desc A",
                AxialCodeId = _axialCodeId,
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                IsDeprecated = false,
            },
            new()
            {
                JudgeTemplateId = Guid.NewGuid(),
                JudgeTemplateName = "Template B",
                JudgeTemplateDescription = "Desc B",
                AxialCodeId = axialCodeId2,
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

        var handler = new GetAllJudgeTemplateHandler(mockContext, CreateMediatorMock(axialCodes: axialCodes));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var judgeTemplates = result.Value!.JudgeTemplates.ToList();
        judgeTemplates.Count.ShouldBe(2);
        judgeTemplates.ShouldContain(t => t.Name == "Template A" && !t.IsDeprecated && t.Template.Contains("Label A"));
        judgeTemplates.ShouldContain(t => t.Name == "Template B" && t.IsDeprecated && t.Template.Contains("Label B"));
    }

    [Fact]
    public async Task WhenRequestIsValid_CallMediatorWithCorrectParameters()
    {
        // Arrange
        var mockSet = new List<JudgeTemplate>().BuildMockDbSet();
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.JudgeTemplates.Returns(mockSet);

        var mediator = CreateMediatorMock();
        var handler = new GetAllJudgeTemplateHandler(mockContext, mediator);
        var request = CreateRequest();

        // Act
        _ = await handler.Handle(request, CancellationToken.None);

        // Assert
        await mediator
            .Received(1)
            .Send(
                Arg.Is<InternalGetAllAxialCodesByVersionRequest>(r =>
                    r.ProjectId == _projectId && r.ProjectVersionId == _projectVersionId && r.UserId == _userId
                ),
                Arg.Any<CancellationToken>()
            );
    }
}
