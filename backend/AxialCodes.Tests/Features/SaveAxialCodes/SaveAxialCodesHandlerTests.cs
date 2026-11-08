using AxialCodes.Data;
using AxialCodes.Data.Models;
using AxialCodes.Features.SaveAxialCodes;
using JudgeTemplates.Contracts.Features.DeleteJudgeTemplatesOfAxialCodes;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using MockQueryable.NSubstitute;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using Shared;

namespace AxialCodes.Tests.Features.SaveAxialCodes;

public class SaveAxialCodesHandlerTests
{
    [Fact]
    public async Task WhenGetProjectReturnsError_ReturnErrorCode()
    {
        // Arrange
        var mockContext = CreateMockContext();
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.NoPermission);

        var handler = new SaveAxialCodesHandler(mediator, mockContext);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.NoPermission, result.ErrorCode);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenProjectDoesNotContainVersion_ReturnInvalidRequest()
    {
        // Arrange
        var mockContext = CreateMockContext();
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(versionId: Guid.NewGuid()));

        var handler = new SaveAxialCodesHandler(mediator, mockContext);
        var request = CreateRequest();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.InvalidRequest, result.ErrorCode);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenTargetResultDoesNotExist_ReturnEntityNotFound()
    {
        // Arrange
        var request = CreateRequest();
        var mockSet = new List<AxialCodingResult>().BuildMockDbSet();
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Returns(mockSet);

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectVersionId));

        var handler = new SaveAxialCodesHandler(mediator, mockContext);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.EntityNotFound, result.ErrorCode);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenApproved_DeletesOldResultsAndTheirJudgeTemplatesAndActivatesTarget()
    {
        // Arrange
        var request = CreateRequest();
        var targetResult = CreateResult(request.AxialCodingResultId, request.ProjectVersionId, isActive: false);
        var previousAxialCodeId = Guid.NewGuid();
        var draftAxialCodeId = Guid.NewGuid();
        var previouslyApproved = CreateResult(
            Guid.NewGuid(),
            request.ProjectVersionId,
            isActive: true,
            axialCodeIds: [previousAxialCodeId]
        );
        var unapprovedDraft = CreateResult(
            Guid.NewGuid(),
            request.ProjectVersionId,
            isActive: false,
            axialCodeIds: [draftAxialCodeId]
        );
        var mockSet = new List<AxialCodingResult>
        {
            targetResult,
            previouslyApproved,
            unapprovedDraft,
        }.BuildMockDbSet();
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mediator = CreateMediator(request.ProjectVersionId);
        var transaction = SetupTransaction(mockContext);
        var handler = new SaveAxialCodesHandler(mediator, mockContext);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(targetResult.IsActive);
        mockSet
            .Received(1)
            .RemoveRange(
                Arg.Is<IEnumerable<AxialCodingResult>>(results =>
                    results.Count() == 2 && results.Contains(previouslyApproved) && results.Contains(unapprovedDraft)
                )
            );
        await mediator
            .Received(1)
            .Send(
                Arg.Is<DeleteJudgeTemplatesOfAxialCodesRequest>(r =>
                    r.ProjectVersionId == request.ProjectVersionId
                    && r.AxialCodeIds.Count == 2
                    && r.AxialCodeIds.Contains(previousAxialCodeId)
                    && r.AxialCodeIds.Contains(draftAxialCodeId)
                ),
                Arg.Any<CancellationToken>()
            );
        await mockContext.Received(2).SaveChangesAsync(Arg.Any<CancellationToken>());
        await transaction.Received(1).CommitAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenDeletingJudgeTemplatesFails_ReturnErrorAndKeepOldResults()
    {
        // Arrange
        var request = CreateRequest();
        var targetResult = CreateResult(request.AxialCodingResultId, request.ProjectVersionId, isActive: false);
        var previouslyApproved = CreateResult(
            Guid.NewGuid(),
            request.ProjectVersionId,
            isActive: true,
            axialCodeIds: [Guid.NewGuid()]
        );
        var mockSet = new List<AxialCodingResult> { targetResult, previouslyApproved }.BuildMockDbSet();
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Returns(mockSet);

        var mediator = CreateMediator(request.ProjectVersionId);
        mediator
            .Send(Arg.Any<DeleteJudgeTemplatesOfAxialCodesRequest>(), Arg.Any<CancellationToken>())
            .Returns(ErrorCode.DatabaseError);
        SetupTransaction(mockContext);
        var handler = new SaveAxialCodesHandler(mediator, mockContext);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.DatabaseError, result.ErrorCode);
        Assert.False(targetResult.IsActive);
        mockSet.DidNotReceive().RemoveRange(Arg.Any<IEnumerable<AxialCodingResult>>());
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenNoOtherResultsExist_DoesNotDeleteAnything()
    {
        // Arrange
        var request = CreateRequest();
        var targetResult = CreateResult(request.AxialCodingResultId, request.ProjectVersionId, isActive: false);
        var mockSet = new List<AxialCodingResult> { targetResult }.BuildMockDbSet();
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mediator = CreateMediator(request.ProjectVersionId);
        SetupTransaction(mockContext);
        var handler = new SaveAxialCodesHandler(mediator, mockContext);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(targetResult.IsActive);
        mockSet.DidNotReceive().RemoveRange(Arg.Any<IEnumerable<AxialCodingResult>>());
        await mediator
            .DidNotReceive()
            .Send(Arg.Any<DeleteJudgeTemplatesOfAxialCodesRequest>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenActivationSaveChangesReturnsZero_ReturnNoChanges()
    {
        // Arrange
        var request = CreateRequest();
        var targetResult = CreateResult(request.AxialCodingResultId, request.ProjectVersionId, isActive: false);
        var mockSet = new List<AxialCodingResult> { targetResult }.BuildMockDbSet();
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(0);

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectVersionId));

        var transaction = SetupTransaction(mockContext);
        var handler = new SaveAxialCodesHandler(mediator, mockContext);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.NoChanges, result.ErrorCode);
        await transaction.DidNotReceive().CommitAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenDatabaseThrowsDbUpdateException_ReturnDatabaseError()
    {
        // Arrange
        var request = CreateRequest();
        var targetResult = CreateResult(request.AxialCodingResultId, request.ProjectVersionId, isActive: false);
        var mockSet = new List<AxialCodingResult> { targetResult }.BuildMockDbSet();
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new DbUpdateException());

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectVersionId));

        SetupTransaction(mockContext);
        var handler = new SaveAxialCodesHandler(mediator, mockContext);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.DatabaseError, result.ErrorCode);
    }

    private static SaveAxialCodesRequest CreateRequest()
    {
        return new SaveAxialCodesRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000001"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000002"),
            AxialCodingResultId = new Guid("A1B2C3D4-0000-0000-0000-000000000003"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000004"),
        };
    }

    private static AxialCodingResult CreateResult(
        Guid resultId,
        Guid versionId,
        bool isActive,
        IEnumerable<Guid>? axialCodeIds = null
    )
    {
        return new AxialCodingResult
        {
            AxialCodingResultId = resultId,
            ProjectVersionId = versionId,
            IsActive = isActive,
            CreatedAt = DateTimeOffset.UnixEpoch,
            AxialCodes = (axialCodeIds ?? [])
                .Select(id => new AxialCode
                {
                    AxialCodeId = id,
                    AxialCodingResultId = resultId,
                    AxialCodingResult = null,
                    Label = "Label",
                    Description = "Description",
                    TraceIds = [],
                })
                .ToList(),
        };
    }

    private static IMediator CreateMediator(Guid versionId)
    {
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(versionId));
        mediator
            .Send(Arg.Any<DeleteJudgeTemplatesOfAxialCodesRequest>(), Arg.Any<CancellationToken>())
            .Returns(new DeleteJudgeTemplatesOfAxialCodesResponse());
        return mediator;
    }

    private static GetProjectResponse CreateProjectResponse(Guid versionId)
    {
        return new GetProjectResponse
        {
            ProjectId = new Guid("B1B2C3D4-0000-0000-0000-000000000001"),
            Name = "TestProject",
            Description = "TestDescription",
            Versions =
            [
                new GetAllProjectVersionsResponse.ProjectVersionSummary
                {
                    VersionId = versionId,
                    ProjectId = new Guid("B1B2C3D4-0000-0000-0000-000000000001"),
                    Name = "V1",
                    Description = "Version 1",
                },
            ],
            AssessmentCriteria = [],
        };
    }

    private static AxialCodeDbContext CreateMockContext()
    {
        return Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
    }

    private static IDbContextTransaction SetupTransaction(AxialCodeDbContext context)
    {
        var transaction = Substitute.For<IDbContextTransaction>();
        var database = Substitute.For<DatabaseFacade>(context);
        database.BeginTransactionAsync(Arg.Any<CancellationToken>()).Returns(transaction);
        context.Database.Returns(database);
        return transaction;
    }
}
