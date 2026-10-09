using Mediator;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using RawLLMOutputs.Features.ImportRawLLMOutput;
using Shared;
using Shouldly;

namespace RawLLMOutputs.Tests.Features.ImportRawLLMOutput
{
    public class ImportRawLLMOutputHandlerTests
    {
        [Fact]
        public async Task WhenProjectDoesNotExist_ReturnsProjectError()
        {
            var request = CreateRequest();
            var mediator = Substitute.For<IMediator>();
            mediator
                .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
                .Returns(ErrorCode.EntityNotFound);
            var context = CreateContext();

            var result = await CreateHandler(mediator, context).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
            await mediator.DidNotReceive().Send(
                Arg.Any<GetAllProjectVersionsQuery>(),
                Arg.Any<CancellationToken>()
            );
        }

        [Fact]
        public async Task WhenProjectVersionsCannotBeRetrieved_ReturnsVersionsError()
        {
            var request = CreateRequest();
            var mediator = Substitute.For<IMediator>();
            mediator
                .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
                .Returns(CreateProjectResponse(request.ProjectId));
            mediator
                .Send(Arg.Any<GetAllProjectVersionsQuery>(), Arg.Any<CancellationToken>())
                .Returns(ErrorCode.DatabaseError);
            var context = CreateContext();

            var result = await CreateHandler(mediator, context).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        [Fact]
        public async Task WhenProjectVersionDoesNotExist_ReturnsEntityNotFound()
        {
            var request = CreateRequest();
            var mediator = CreateMediator(request.ProjectId, []);
            var context = CreateContext();

            var result = await CreateHandler(mediator, context).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        [Fact]
        public async Task WhenFileIsNotJson_ReturnsUnsupportedFileType()
        {
            var request = CreateRequest(contentType: "text/plain");
            var mediator = CreateMediator(request.ProjectId, [CreateVersion(request.ProjectVersionId)]);
            var context = CreateContext();

            var result = await CreateHandler(mediator, context).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.UnsupportedFileType);
            await context.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task WhenDatabaseSaveFails_ReturnsDatabaseError()
        {
            var request = CreateRequest();
            var mediator = CreateMediator(request.ProjectId, [CreateVersion(request.ProjectVersionId)]);
            var context = CreateContext();
            context.SaveChangesAsync(Arg.Any<CancellationToken>())
                .Throws(new InvalidOperationException("Database failure"));

            var result = await CreateHandler(mediator, context).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        [Fact]
        public async Task WhenDatabaseMakesNoChanges_ReturnsNoChanges()
        {
            var request = CreateRequest();
            var mediator = CreateMediator(request.ProjectId, [CreateVersion(request.ProjectVersionId)]);
            var context = CreateContext();
            context.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(0);

            var result = await CreateHandler(mediator, context).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
        }

        [Fact]
        public async Task WhenRequestIsValid_SavesAndReturnsRawLlmOutput()
        {
            var request = CreateRequest();
            var outputs = new List<RawLLMOutput>();
            var outputSet = outputs.BuildMockDbSet();
            var context = CreateContext();
            context.RawLLMOutputs.Returns(outputSet);
            context.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);
            var mediator = CreateMediator(request.ProjectId, [CreateVersion(request.ProjectVersionId)]);

            var result = await CreateHandler(mediator, context).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.RawLLMOutputId.ShouldNotBe(Guid.Empty);
            response.ProjectVersionId.ShouldBe(request.ProjectVersionId);
            response.Name.ShouldBe(request.Name);
            response.CreatedAt.ShouldBeInRange(DateTime.UtcNow.AddSeconds(-5), DateTime.UtcNow.AddSeconds(5));
            outputSet.Received(1).Add(Arg.Is<RawLLMOutput>(output =>
                output.RawLLMOutputId == response.RawLLMOutputId &&
                output.VersionId == request.ProjectVersionId &&
                output.Name == request.Name &&
                output.Output == request.File.ContentDisposition
            ));
        }

        private static ImportRawLLMOutputHandler CreateHandler(IMediator mediator, RawLLMOutputDbContext context)
        {
            return new ImportRawLLMOutputHandler(mediator, context);
        }

        private static RawLLMOutputDbContext CreateContext()
        {
            return Substitute.For<RawLLMOutputDbContext>(
                new DbContextOptionsBuilder<RawLLMOutputDbContext>().Options
            );
        }

        private static IMediator CreateMediator(
            Guid projectId,
            List<GetAllProjectVersionsResponse.ProjectVersionSummary> versions
        )
        {
            var mediator = Substitute.For<IMediator>();
            mediator
                .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
                .Returns(CreateProjectResponse(projectId));
            mediator
                .Send(Arg.Any<GetAllProjectVersionsQuery>(), Arg.Any<CancellationToken>())
                .Returns(new GetAllProjectVersionsResponse { Versions = versions });
            return mediator;
        }

        private static ImportRawLLMOutputRequest CreateRequest(string contentType = "application/json")
        {
            var file = Substitute.For<IFormFile>();
            file.ContentType.Returns(contentType);
            file.ContentDisposition.Returns("{\"output\":\"test\"}");

            return new ImportRawLLMOutputRequest
            {
                ProjectId = Guid.Parse("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                ProjectVersionId = Guid.Parse("68DF6625-60EA-4E0A-8F29-29DE14197025"),
                UserId = Guid.Parse("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                Name = "Imported output",
                File = file
            };
        }

        private static GetProjectResponse CreateProjectResponse(Guid projectId)
        {
            return new GetProjectResponse
            {
                ProjectId = projectId,
                Name = "Project",
                Description = "Description",
                Versions = [],
                AssessmentCriteria = []
            };
        }

        private static GetAllProjectVersionsResponse.ProjectVersionSummary CreateVersion(Guid versionId)
        {
            return new GetAllProjectVersionsResponse.ProjectVersionSummary
            {
                VersionId = versionId,
                ProjectId = Guid.Parse("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Name = "Version",
                Description = "Description"
            };
        }
    }
}
