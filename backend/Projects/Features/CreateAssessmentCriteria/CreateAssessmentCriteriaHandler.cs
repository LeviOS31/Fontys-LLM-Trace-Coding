using Mediator;
using Projects.Contracts.Features.GetProject;
using Projects.Data;
using Serilog;
using Shared;


namespace Projects.Features.CreateAssessmentCriteria
{
    public class CreateAssessmentCriteriaHandler : IRequestHandler<CreateAssessmentCriteriaRequest, Result<CreateAssessmentCriteriaResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<CreateAssessmentCriteriaHandler>();
        private readonly ProjectDbContext _projectsDbContext;
        private readonly IMediator _mediator;

        public CreateAssessmentCriteriaHandler(ProjectDbContext projectsDbContext, IMediator mediator)
        {
            _projectsDbContext = projectsDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<CreateAssessmentCriteriaResponse>> Handle(
            CreateAssessmentCriteriaRequest request,
            CancellationToken cancellationToken 
        )
        {
            var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId, UserId = request.UserId };
            var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);
        }
    }
}
