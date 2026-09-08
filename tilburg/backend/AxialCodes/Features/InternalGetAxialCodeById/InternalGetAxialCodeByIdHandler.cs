using System.Data.Common;
using AxialCodes.Contracts.Features.InternalGetAxialCodeById;
using AxialCodes.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace AxialCodes.Features.InternalGetAxialCodeById;

public class InternalGetAxialCodeByIdHandler
    : IRequestHandler<InternalGetAxialCodeByIdRequest, Result<InternalGetAxialCodeByIdResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<InternalGetAxialCodeByIdHandler>();
    private readonly AxialCodeDbContext _dbContext;
    private readonly IMediator _mediator;

    public InternalGetAxialCodeByIdHandler(AxialCodeDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<InternalGetAxialCodeByIdResponse>> Handle(
        InternalGetAxialCodeByIdRequest request,
        CancellationToken cancellationToken
    )
    {
        // Permission validation
        var getProjectResult = await _mediator.Send(
            new GetProjectQuery { UserId = request.UserId, ProjectId = request.ProjectId },
            cancellationToken
        );

        if (getProjectResult.IsError)
        {
            return getProjectResult.ErrorCode!;
        }

        // Is the version part of the project?
        var doesProjectContainVersion =
            getProjectResult.Value.Versions.Find(v => v.VersionId == request.ProjectVersionId) != null;
        if (!doesProjectContainVersion)
        {
            return ErrorCode.InvalidRequest;
        }

        // Get axial code by Id from the active axial-coding result.
        InternalGetAxialCodeByIdResponse? axialCode;
        try
        {
            axialCode = await _dbContext
                .AxialCodingResults.AsNoTracking()
                .Where(a => a.ProjectVersionId == request.ProjectVersionId && a.IsActive)
                .SelectMany(a => a.AxialCodes)
                .Where(a => a.AxialCodeId == request.AxialCodeId)
                .Select(a => new InternalGetAxialCodeByIdResponse
                {
                    AxialCodeId = a.AxialCodeId,
                    ProjectVersionId = request.ProjectVersionId,
                    Label = a.Label,
                    Description = a.Description,
                    TraceIds = a.TraceIds,
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving axial code by id: {AxialCodeId}", request.AxialCodeId);
            return ErrorCode.DatabaseError;
        }

        if (axialCode is null)
        {
            return ErrorCode.EntityNotFound;
        }

        return axialCode;
    }
}
