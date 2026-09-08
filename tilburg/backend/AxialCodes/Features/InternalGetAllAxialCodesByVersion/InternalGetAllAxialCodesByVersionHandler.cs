using System.Data.Common;
using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using AxialCodes.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace AxialCodes.Features.InternalGetAllAxialCodesByVersion;

public class InternalGetAllAxialCodesByVersionHandler
    : IRequestHandler<InternalGetAllAxialCodesByVersionRequest, Result<InternalGetAllAxialCodesByVersionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<InternalGetAllAxialCodesByVersionHandler>();
    private readonly AxialCodeDbContext _dbContext;
    private readonly IMediator _mediator;

    public InternalGetAllAxialCodesByVersionHandler(AxialCodeDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<InternalGetAllAxialCodesByVersionResponse>> Handle(
        InternalGetAllAxialCodesByVersionRequest request,
        CancellationToken cancellationToken
    )
    {
        var getProjectResult = await _mediator.Send(
            new GetProjectQuery { UserId = request.UserId, ProjectId = request.ProjectId },
            cancellationToken
        );

        if (getProjectResult.IsError)
        {
            return getProjectResult.ErrorCode!;
        }

        var doesProjectContainVersion =
            getProjectResult.Value.Versions.Find(v => v.VersionId == request.ProjectVersionId) != null;
        if (!doesProjectContainVersion)
        {
            return ErrorCode.InvalidRequest;
        }

        IEnumerable<InternalGetAllAxialCodesByVersionResponse.AxialCodeEntry> axialCodes;
        try
        {
            axialCodes = await _dbContext
                .AxialCodingResults.AsNoTracking()
                .Where(r => r.ProjectVersionId == request.ProjectVersionId)
                .SelectMany(r =>
                    r.AxialCodes.Select(a => new InternalGetAllAxialCodesByVersionResponse.AxialCodeEntry
                    {
                        AxialCodeId = a.AxialCodeId,
                        Label = a.Label,
                        Description = a.Description,
                        IsActive = r.IsActive,
                    })
                )
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error retrieving axial codes for project version {ProjectVersionId}",
                request.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }

        return new InternalGetAllAxialCodesByVersionResponse { AxialCodes = axialCodes };
    }
}
