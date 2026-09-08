using AxialCodes.Contracts.Features.InternalGetAxialCodeById;
using AxialCodes.Data;
using AxialCodes.Data.Models;
using AxialCodes.Features.InternalGetAxialCodeById;
using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;
using Shared;
using Shouldly;

namespace AxialCodes.Tests.Features.InternalGetAxialCodeById;

public class InternalGetAxialCodeByIdHandlerTests
{
    [Fact]
    public async Task WhenGetProjectReturnsError_ReturnErrorCode()
    {
        // Arrange
        var mockContext = CreateMockContext();
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.NoPermission);

        var handler = new InternalGetAxialCodeByIdHandler(mockContext, mediator);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoPermission);
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

        var handler = new InternalGetAxialCodeByIdHandler(mockContext, mediator);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.InvalidRequest);
    }

    [Fact]
    public async Task WhenDatabaseThrowsOnQuery_ReturnDatabaseError()
    {
        // Arrange
        var request = CreateRequest();
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Throws(new InvalidOperationException("Simulated failure"));

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectVersionId));

        var handler = new InternalGetAxialCodeByIdHandler(mockContext, mediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenActiveResultDoesNotContainAxialCode_ReturnEntityNotFound()
    {
        // Arrange
        var request = CreateRequest();
        var mockContext = CreateMockContextWithResults(CreateAxialCodingResult(request.ProjectVersionId));

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectVersionId));

        var handler = new InternalGetAxialCodeByIdHandler(mockContext, mediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenActiveResultContainsAxialCode_ReturnAxialCode()
    {
        // Arrange
        var request = CreateRequest();
        var traceIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
        var axialCode = new AxialCode
        {
            AxialCodingResultId = Guid.NewGuid(),
            AxialCodingResult = null,
            AxialCodeId = request.AxialCodeId,
            Label = "Usability",
            Description = "User interaction feedback",
            TraceIds = traceIds,
        };

        var mockContext = CreateMockContextWithResults(CreateAxialCodingResult(request.ProjectVersionId, axialCode));

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectVersionId));

        var handler = new InternalGetAxialCodeByIdHandler(mockContext, mediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.AxialCodeId.ShouldBe(axialCode.AxialCodeId);
        result.Value.ProjectVersionId.ShouldBe(request.ProjectVersionId);
        result.Value.Label.ShouldBe(axialCode.Label);
        result.Value.Description.ShouldBe(axialCode.Description);
        result.Value.TraceIds.ShouldBe(traceIds);
    }

    private static InternalGetAxialCodeByIdRequest CreateRequest()
    {
        return new InternalGetAxialCodeByIdRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000010"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000011"),
            AxialCodeId = new Guid("A1B2C3D4-0000-0000-0000-000000000012"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000013"),
        };
    }

    private static GetProjectResponse CreateProjectResponse(Guid versionId)
    {
        return new GetProjectResponse
        {
            ProjectId = new Guid("B1B2C3D4-0000-0000-0000-000000000010"),
            Name = "TestProject",
            Description = "TestDescription",
            Versions =
            [
                new InternalGetProjectVersionsResponse.ProjectVersionSummary
                {
                    VersionId = versionId,
                    ProjectId = new Guid("B1B2C3D4-0000-0000-0000-000000000010"),
                    Name = "V1",
                    Description = "Version 1",
                },
            ],
            AssessmentCriteria = [],
        };
    }

    private static AxialCodingResult CreateAxialCodingResult(Guid projectVersionId, params AxialCode[] axialCodes)
    {
        return new AxialCodingResult
        {
            AxialCodingResultId = Guid.NewGuid(),
            ProjectVersionId = projectVersionId,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            AxialCodes = axialCodes,
        };
    }

    private static AxialCodeDbContext CreateMockContextWithResults(params AxialCodingResult[] results)
    {
        var mockContext = CreateMockContext();
        var mockSet = results.ToList().BuildMockDbSet();
        mockContext.AxialCodingResults.Returns(mockSet);
        return mockContext;
    }

    private static AxialCodeDbContext CreateMockContext()
    {
        return Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
    }
}
