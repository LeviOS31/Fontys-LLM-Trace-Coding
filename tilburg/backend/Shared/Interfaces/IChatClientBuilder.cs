using Microsoft.Extensions.AI;

namespace Shared.Interfaces;

public interface IChatClientBuilder
{
    IChatClientBuilder WithProvider(string? provider);
    IChatClientBuilder WithEndpoint(Uri? endpoint);
    IChatClientBuilder WithModel(string? model);
    Result<IChatClient> Build();
}
