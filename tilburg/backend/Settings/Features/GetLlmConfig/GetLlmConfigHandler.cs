using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Settings.Contracts.Features.GetLlmConfig;
using Settings.Data;
using Settings.Data.Models;
using Shared;

namespace Settings.Features.GetLlmConfig;

public class GetLlmConfigHandler : IRequestHandler<GetLlmConfigQuery, Result<GetLlmConfigResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetLlmConfigHandler>();
    private readonly SettingsDbContext _dbContext;

    public GetLlmConfigHandler(SettingsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<Result<GetLlmConfigResponse>> Handle(
        GetLlmConfigQuery request,
        CancellationToken cancellationToken
    )
    {
        // Get current config
        ChatClientConfiguration? existingConfig;
        try
        {
            existingConfig = await _dbContext.ChatClientConfigurations.FirstOrDefaultAsync(
                c => c.UserId == request.UserId,
                cancellationToken
            );
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving LLM config for user {UserId}", request.UserId);
            return ErrorCode.DatabaseError;
        }

        if (existingConfig is null)
        {
            Logger.Error("No LLM config found for user {UserId}", request.UserId);
            return ErrorCode.EntityNotFound;
        }

        return new GetLlmConfigResponse
        {
            ProviderName = existingConfig.Provider,
            Endpoint = existingConfig.Endpoint,
            ModelName = existingConfig.Model,
        };
    }
}
