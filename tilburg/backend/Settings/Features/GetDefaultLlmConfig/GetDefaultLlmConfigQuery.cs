using Mediator;
using Shared;

namespace Settings.Features.GetDefaultLlmConfig;

public record GetDefaultLlmConfigQuery : IRequest<Result<GetDefaultLlmConfigResponse>> { }
