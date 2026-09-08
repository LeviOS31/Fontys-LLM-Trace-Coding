using AxialCodes.Contracts.Features.GetAxialCodes;
using Mediator;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;
using Shared;
using Shouldly;
using Statistics.Features.GetProjectVersionStatistics;
using Traces.Contracts.Features.GetTracesCount;
using Traces.Contracts.Features.GetVersionOpencode;

namespace Statistics.Tests.Features.GetProjectVersionStatistics;

public class GetProjectVersionStatisticsHandlerTests
{
    [Fact]
    public async Task WhenGetProjectReturnsError_ReturnErrorCode()
    {
        // Arrange
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.NoPermission);

        var handler = new GetProjectVersionStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(CreateQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoPermission);
    }

    [Fact]
    public async Task WhenVersionNotInProject_ReturnInvalidRequest()
    {
        // Arrange
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(versionId: Guid.NewGuid()));

        var handler = new GetProjectVersionStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(CreateQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.InvalidRequest);
    }

    [Fact]
    public async Task WhenGetTracesCountReturnsError_ReturnErrorCode()
    {
        // Arrange
        var query = CreateQuery();
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(query.VersionId));
        mediator.Send(Arg.Any<GetTracesCountQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.DatabaseError);

        var handler = new GetProjectVersionStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenGetOpenCodesReturnsError_ReturnErrorCode()
    {
        // Arrange
        var query = CreateQuery();
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(query.VersionId));
        mediator
            .Send(Arg.Any<GetTracesCountQuery>(), Arg.Any<CancellationToken>())
            .Returns(new GetTracesCountResponse { TotalCount = 5 });
        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(ErrorCode.DatabaseError);

        var handler = new GetProjectVersionStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenGetAxialCodesReturnsError_ReturnErrorCode()
    {
        // Arrange
        var query = CreateQuery();
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(query.VersionId));
        mediator
            .Send(Arg.Any<GetTracesCountQuery>(), Arg.Any<CancellationToken>())
            .Returns(new GetTracesCountResponse { TotalCount = 5 });
        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(new GetVersionOpencodeResponse() { Opencodes = [] });
        mediator.Send(Arg.Any<GetAxialCodesQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.DatabaseError);

        var handler = new GetProjectVersionStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenRequestIsValid_ReturnsVersionStatistics()
    {
        // Arrange
        var query = CreateQuery();
        var axialCodeId = new Guid("C1B2C3D4-0000-0000-0000-000000000001");
        var traceId1 = new Guid("D1B2C3D4-0000-0000-0000-000000000001");
        var traceId2 = new Guid("D1B2C3D4-0000-0000-0000-000000000002");

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(query.VersionId));
        mediator
            .Send(Arg.Any<GetTracesCountQuery>(), Arg.Any<CancellationToken>())
            .Returns(new GetTracesCountResponse { TotalCount = 10 });
        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetVersionOpencodeResponse
                {
                    Opencodes =
                    [
                        new GetVersionOpencodeResponse.OpencodeViewModel() { TraceId = traceId1, OpenCode = "Code A" },
                        new GetVersionOpencodeResponse.OpencodeViewModel { TraceId = traceId2, OpenCode = "Code B" },
                    ],
                }
            );
        mediator
            .Send(Arg.Any<GetAxialCodesQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetAxialCodesResponse
                {
                    CreatedAt = DateTimeOffset.UtcNow,
                    AxialCodes =
                    [
                        new AxialCodeViewModel
                        {
                            AxialCodeId = axialCodeId,
                            ProjectVersionId = query.VersionId,
                            Label = "Theme A",
                            Description = "Description A",
                            TraceIds = [traceId1, traceId2],
                        },
                    ],
                }
            );

        var handler = new GetProjectVersionStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.VersionTraceCount.ShouldBe(10);
        result.Value.VersionOpenCodeCount.ShouldBe(2);
        result.Value.VersionAxialCodeCount.ShouldBe(1);

        var returnedAxialCode = result.Value.VersionAxialCodes.ShouldHaveSingleItem();
        returnedAxialCode.Label.ShouldBe("Theme A");
        returnedAxialCode.Description.ShouldBe("Description A");
        returnedAxialCode.OpenCodeCount.ShouldBe(2);
    }

    [Fact]
    public async Task WhenAxialCodesIsNull_ReturnsEmptyAxialCodes()
    {
        // Arrange
        var query = CreateQuery();
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(query.VersionId));
        mediator
            .Send(Arg.Any<GetTracesCountQuery>(), Arg.Any<CancellationToken>())
            .Returns(new GetTracesCountResponse { TotalCount = 3 });
        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(new GetVersionOpencodeResponse() { Opencodes = [] });
        mediator
            .Send(Arg.Any<GetAxialCodesQuery>(), Arg.Any<CancellationToken>())
            .Returns(new GetAxialCodesResponse { CreatedAt = null, AxialCodes = null });

        var handler = new GetProjectVersionStatisticsHandler(mediator, CreateScopeFactory(mediator));

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.VersionAxialCodeCount.ShouldBe(0);
        result.Value.VersionAxialCodes.ShouldBeEmpty();
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

    private static GetProjectVersionStatisticsQuery CreateQuery()
    {
        return new GetProjectVersionStatisticsQuery
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000010"),
            VersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000011"),
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
}
