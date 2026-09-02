using AxialCodes.Contracts.Features.GetAxialCodes;
using AxialCodes.Data;
using AxialCodes.Data.Models;
using AxialCodes.Features.GetAxialCodes;
using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;
using Shared;
using Shouldly;

namespace AxialCodes.Tests.Features.GetAxialCodes;

public class GetAxialCodesHandlerTests
{
    [Fact]
    public async Task WhenGetProjectReturnsError_ReturnErrorCode()
    {
        // Arrange
        var mockContext = CreateMockContext();
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.NoPermission);

        var handler = new GetAxialCodesHandler(mockContext, mediator);

        // Act
        var result = await handler.Handle(CreateQuery(), CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.NoPermission, result.ErrorCode);
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

        var handler = new GetAxialCodesHandler(mockContext, mediator);
        var query = CreateQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.InvalidRequest, result.ErrorCode);
    }

    [Fact]
    public async Task WhenDatabaseThrowsOnQuery_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Throws(new InvalidOperationException("Simulated failure"));

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(CreateQuery().ProjectVersionId));

        var handler = new GetAxialCodesHandler(mockContext, mediator);

        // Act
        var result = await handler.Handle(CreateQuery(), CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.DatabaseError, result.ErrorCode);
    }

    [Fact]
    public async Task WhenNoActiveResultExists_ReturnEmptyResult()
    {
        // Arrange
        var query = CreateQuery();
        var mockSet = new List<AxialCodingResult>().BuildMockDbSet();
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Returns(mockSet);

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(query.ProjectVersionId));

        var handler = new GetAxialCodesHandler(mockContext, mediator);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        result.Value.AxialCodes.ShouldBeNull();
        result.Value.CreatedAt.ShouldBeNull();
    }

    [Fact]
    public async Task WhenActiveResultExists_ReturnsAxialCodes()
    {
        // Arrange
        var query = CreateQuery();
        var createdAt = new DateTimeOffset(2024, 4, 9, 12, 0, 0, TimeSpan.Zero);
        var resultId = Guid.NewGuid();
        var axialCodes = new List<AxialCode>
        {
            new()
            {
                AxialCodingResultId = resultId,
                AxialCodingResult = null,
                AxialCodeId = Guid.NewGuid(),
                Label = "UX",
                Description = "User experience related",
                TraceIds = new List<Guid> { Guid.NewGuid() },
            },
        };

        var result = new AxialCodingResult
        {
            AxialCodingResultId = resultId,
            ProjectVersionId = query.ProjectVersionId,
            IsActive = true,
            CreatedAt = createdAt,
            AxialCodes = axialCodes,
        };

        var mockSet = new List<AxialCodingResult> { result }.BuildMockDbSet();
        var mockContext = CreateMockContext();
        mockContext.AxialCodingResults.Returns(mockSet);

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(query.ProjectVersionId));

        var handler = new GetAxialCodesHandler(mockContext, mediator);

        // Act
        var response = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(response.IsSuccess);
        Assert.Equal(createdAt, response.Value.CreatedAt);
        var returnedCodes = response.Value.AxialCodes.ToList();
        Assert.Single(returnedCodes);
        Assert.Equal(axialCodes[0].AxialCodeId, returnedCodes[0].AxialCodeId);
        Assert.Equal(query.ProjectVersionId, returnedCodes[0].ProjectVersionId);
        Assert.Equal(axialCodes[0].Label, returnedCodes[0].Label);
        Assert.Equal(axialCodes[0].Description, returnedCodes[0].Description);
        Assert.Equal(axialCodes[0].TraceIds, returnedCodes[0].TraceIds);
    }

    private static GetAxialCodesQuery CreateQuery()
    {
        return new GetAxialCodesQuery
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000010"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000011"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000012"),
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

    private static AxialCodeDbContext CreateMockContext()
    {
        return Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
    }
}
