using Mediator;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;
using Shared;
using Shouldly;
using Statistics.Features.GetProjectStatistics;
using Statistics.Features.GetProjectVersionStatistics;
using Statistics.Features.Shared;

namespace Statistics.Tests.Features.GetProjectStatistics;

public class GetProjectStatisticsHandlerTests
{
    [Fact]
    public async Task WhenGetProjectReturnsError_ReturnErrorCode()
    {
        // Arrange
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.NoPermission);

        var handler = new GetProjectStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(CreateQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoPermission);
    }

    [Fact]
    public async Task WhenVersionStatisticsReturnsError_ReturnErrorCode()
    {
        // Arrange
        var query = CreateQuery();
        var versionId = new Guid("A1B2C3D4-0000-0000-0000-000000000021");

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse([("V1", versionId)]));
        mediator
            .Send(Arg.Any<GetProjectVersionStatisticsQuery>(), Arg.Any<CancellationToken>())
            .Returns(ErrorCode.DatabaseError);

        var handler = new GetProjectStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenProjectHasNoVersions_ReturnsZeroTotals()
    {
        // Arrange
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(CreateProjectResponse([]));

        var handler = new GetProjectStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(CreateQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.TotalTraceCount.ShouldBe(0);
        result.Value.TotalOpenCodeCount.ShouldBe(0);
        result.Value.TotalAxialCodeCount.ShouldBe(0);
        result.Value.VersionTotalTraceCount.ShouldBeEmpty();
        result.Value.VersionAxialCodes.ShouldBeEmpty();
    }

    [Fact]
    public async Task WhenProjectHasMultipleVersions_ReturnsAggregatedStatistics()
    {
        // Arrange
        var query = CreateQuery();
        var versionId1 = new Guid("A1B2C3D4-0000-0000-0000-000000000021");
        var versionId2 = new Guid("A1B2C3D4-0000-0000-0000-000000000022");

        var axialCodesV1 = new List<AxialCodeReturnItem>
        {
            new()
            {
                Label = "Theme A",
                Description = "Desc A",
                OpenCodeCount = 3,
            },
        };
        var axialCodesV2 = new List<AxialCodeReturnItem>
        {
            new()
            {
                Label = "Theme B",
                Description = "Desc B",
                OpenCodeCount = 2,
            },
            new()
            {
                Label = "Theme C",
                Description = "Desc C",
                OpenCodeCount = 1,
            },
        };

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse([("V1", versionId1), ("V2", versionId2)]));
        mediator
            .Send(
                Arg.Is<GetProjectVersionStatisticsQuery>(q => q.VersionId == versionId1),
                Arg.Any<CancellationToken>()
            )
            .Returns(
                new GetProjectVersionStatisticsResponse
                {
                    VersionTraceCount = 4,
                    VersionOpenCodeCount = 6,
                    VersionAxialCodeCount = axialCodesV1.Count,
                    VersionAxialCodes = axialCodesV1,
                }
            );
        mediator
            .Send(
                Arg.Is<GetProjectVersionStatisticsQuery>(q => q.VersionId == versionId2),
                Arg.Any<CancellationToken>()
            )
            .Returns(
                new GetProjectVersionStatisticsResponse
                {
                    VersionTraceCount = 9,
                    VersionOpenCodeCount = 3,
                    VersionAxialCodeCount = axialCodesV2.Count,
                    VersionAxialCodes = axialCodesV2,
                }
            );

        var handler = new GetProjectStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.TotalTraceCount.ShouldBe(13);
        result.Value.TotalOpenCodeCount.ShouldBe(9);
        result.Value.TotalAxialCodeCount.ShouldBe(3);

        result.Value.VersionTotalTraceCount.Count.ShouldBe(2);
        result.Value.VersionTotalTraceCount["V1"].ShouldBe(4);
        result.Value.VersionTotalTraceCount["V2"].ShouldBe(9);

        result.Value.VersionAxialCodes.Count.ShouldBe(2);
        result.Value.VersionAxialCodes["V1"].ShouldBe(axialCodesV1);
        result.Value.VersionAxialCodes["V2"].ShouldBe(axialCodesV2);
    }

    private static IServiceScopeFactory CreateScopeFactory(IMediator mediator)
    {
        var serviceProvider = Substitute.For<IServiceProvider>();
        serviceProvider.GetService(typeof(IMediator)).Returns(mediator);

        var scope = Substitute.For<IServiceScope>();
        scope.ServiceProvider.Returns(serviceProvider);

        var scopeFactory = Substitute.For<IServiceScopeFactory>();
        scopeFactory.CreateScope().Returns(scope);

        return scopeFactory;
    }

    private static GetProjectStatisticsQuery CreateQuery()
    {
        return new GetProjectStatisticsQuery
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000010"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000012"),
        };
    }

    private static GetProjectResponse CreateProjectResponse(IEnumerable<(string Name, Guid VersionId)> versions)
    {
        return new GetProjectResponse
        {
            ProjectId = new Guid("B1B2C3D4-0000-0000-0000-000000000010"),
            Name = "TestProject",
            Description = "TestDescription",
            Versions = versions
                .Select(v => new InternalGetProjectVersionsResponse.ProjectVersionSummary
                {
                    VersionId = v.VersionId,
                    ProjectId = new Guid("B1B2C3D4-0000-0000-0000-000000000010"),
                    Name = v.Name,
                    Description = $"Description for {v.Name}",
                })
                .ToList(),
            AssessmentCriteria = [],
        };
    }
}
