using System.Data.Common;
using AxialCodes.Contracts.Features.GetAxialCodes;
using AxialCodes.Data;
using AxialCodes.Data.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace AxialCodes.Features.GetAxialCodes;

public class GetAxialCodesHandler : IRequestHandler<GetAxialCodesQuery, Result<GetAxialCodesResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetAxialCodesHandler>();
    private readonly AxialCodeDbContext _dbContext;
    private readonly IMediator _mediator;

    public GetAxialCodesHandler(AxialCodeDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetAxialCodesResponse>> Handle(
        GetAxialCodesQuery query,
        CancellationToken cancellationToken
    )
    {
        // Permission validation
        var getProjectResult = await _mediator.Send(
            new GetProjectQuery { UserId = query.UserId, ProjectId = query.ProjectId },
            cancellationToken
        );

        if (getProjectResult.IsError)
        {
            return getProjectResult.ErrorCode!;
        }

        // Is the version part of the project?
        var doesProjectContainVersion =
            getProjectResult.Value.Versions.Find(v => v.VersionId == query.ProjectVersionId) != null;
        if (!doesProjectContainVersion)
        {
            return ErrorCode.InvalidRequest;
        }

        // Get axial codes
        AxialCodingResult? axialCodingResult;
        try
        {
            axialCodingResult = await _dbContext
                .AxialCodingResults.AsNoTracking()
                .Include(a => a.AxialCodes)
                .FirstOrDefaultAsync(
                    a => a.ProjectVersionId == query.ProjectVersionId && a.IsActive,
                    cancellationToken
                );
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving axial codes for version: {ProjectVersionId}", query.ProjectVersionId);
            return ErrorCode.DatabaseError;
        }

        if (axialCodingResult is null)
        {
            return new GetAxialCodesResponse { CreatedAt = null, AxialCodes = null };
        }

        return new GetAxialCodesResponse
        {
            CreatedAt = axialCodingResult.CreatedAt,
            AxialCodes = axialCodingResult.AxialCodes.Select(a => new AxialCodeViewModel
            {
                AxialCodeId = a.AxialCodeId,
                ProjectVersionId = axialCodingResult.ProjectVersionId,
                Label = a.Label,
                Description = a.Description,
                TraceIds = a.TraceIds,
            }),
        };
    }
}
