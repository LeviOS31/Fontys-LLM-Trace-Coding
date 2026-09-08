using AxialCodes.Contracts.Features.InternalGetAxialCodeById;
using JudgeTemplates.Data;
using JudgeTemplates.Feature.CreateJudgeTemplate;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Shared;
using Shouldly;

namespace JudgeTemplates.Tests.Features.CreateJudgeTemplate;

public class CreateJudgeTemplateHandlerTests
{
    private static readonly Guid _projectId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _projectVersionId = new("68DF6625-60EA-4E0A-8F29-29DE14197025");
    private static readonly Guid _axialCodeId = new("68DF6625-60EA-4E0A-8F29-29DE14197026");
    private static readonly Guid _userId = new("CE97539F-4189-44FC-A87F-CFA3EDB177ED");

    private static IMediator CreateMediatorMock(ErrorCode? errorCode = null)
    {
        var mediator = Substitute.For<IMediator>();
        Result<InternalGetAxialCodeByIdResponse> result = errorCode is null
            ? new InternalGetAxialCodeByIdResponse
            {
                AxialCodeId = _axialCodeId,
                ProjectVersionId = _projectVersionId,
                Label = "Test Label",
                Description = "Test Description",
                TraceIds = [],
            }
            : errorCode.Value;

        mediator.Send(Arg.Any<InternalGetAxialCodeByIdRequest>(), Arg.Any<CancellationToken>()).Returns(result);
        return mediator;
    }

    private static CreateJudgeTemplateRequest CreateRequest() =>
        new()
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            AxialCodeId = _axialCodeId,
            UserId = _userId,
            Name = "My Template",
            Description = "A description",
        };

    [Fact]
    public async Task WhenRequestIsValid_ReturnCreatedJudgeTemplateId()
    {
        // Arrange
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var handler = new CreateJudgeTemplateHandler(mockContext, CreateMediatorMock());

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeTemplateId.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task WhenAxialCodeValidationFails_ReturnError()
    {
        // Arrange
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );

        var handler = new CreateJudgeTemplateHandler(mockContext, CreateMediatorMock(ErrorCode.EntityNotFound));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenDatabaseThrowsDbUpdateException_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new DbUpdateException());

        var handler = new CreateJudgeTemplateHandler(mockContext, CreateMediatorMock());

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
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new NpgsqlException());

        var handler = new CreateJudgeTemplateHandler(mockContext, CreateMediatorMock());

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenDatabaseReturnsNoChanges_ReturnNoChangesError()
    {
        // Arrange
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(0);

        var handler = new CreateJudgeTemplateHandler(mockContext, CreateMediatorMock());

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
    }

    [Fact]
    public async Task WhenRequestIsValid_CallMediatorWithCorrectParameters()
    {
        // Arrange
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mediator = CreateMediatorMock();
        var handler = new CreateJudgeTemplateHandler(mockContext, mediator);
        var request = CreateRequest();

        // Act
        _ = await handler.Handle(request, CancellationToken.None);

        // Assert
        await mediator
            .Received(1)
            .Send(
                Arg.Is<InternalGetAxialCodeByIdRequest>(r =>
                    r.ProjectId == _projectId
                    && r.ProjectVersionId == _projectVersionId
                    && r.AxialCodeId == _axialCodeId
                    && r.UserId == _userId
                ),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    public async Task WhenDescriptionIsNull_CreateTemplateWithEmptyDescription()
    {
        // Arrange
        var mockContext = Substitute.For<JudgeTemplatesDbContext>(
            new DbContextOptionsBuilder<JudgeTemplatesDbContext>().Options
        );
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var handler = new CreateJudgeTemplateHandler(mockContext, CreateMediatorMock());
        var request = new CreateJudgeTemplateRequest
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            AxialCodeId = _axialCodeId,
            UserId = _userId,
            Name = "My Template",
            Description = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeTemplateId.ShouldNotBe(Guid.Empty);
    }
}
