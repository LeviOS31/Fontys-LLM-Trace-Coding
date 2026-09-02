using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Settings.Data;
using Shared;

namespace Settings.Features.SetLlmConfig;

public class SetLlmConfigHandler : IRequestHandler<SetLlmConfigRequest, Result<SetLlmConfigResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<SetLlmConfigHandler>();
    private readonly SettingsDbContext _dbContext;

    public SetLlmConfigHandler(SettingsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<Result<SetLlmConfigResponse>> Handle(
        SetLlmConfigRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var rowsUpdated = await _dbContext
                .ChatClientConfigurations.Where(c => c.UserId == request.UserId)
                .ExecuteUpdateAsync(
                    updates =>
                        updates
                            .SetProperty(c => c.Provider, request.ProviderName)
                            .SetProperty(c => c.Endpoint, request.Endpoint)
                            .SetProperty(c => c.Model, request.ModelName),
                    cancellationToken
                );

            if (rowsUpdated == 0)
            {
                Logger.Error("No LLM config found to update for user {UserId}", request.UserId);
                return ErrorCode.EntityNotFound;
            }
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error saving LLM config for user {UserId}", request.UserId);
            return ErrorCode.DatabaseError;
        }

        return new SetLlmConfigResponse
        {
            ProviderName = request.ProviderName,
            Endpoint = request.Endpoint,
            ModelName = request.ModelName,
        };
    }
}
