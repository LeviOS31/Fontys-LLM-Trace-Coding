using FluentValidation;
using Mediator;
using Microsoft.AspNetCore.Http;
using Shared;

namespace RawLLMOutputs.Features.ImportRawLLMData
{
    public record ImportRawLLMOutputRequest : IRequest<Result<ImportRawLLMOutputResponse>>
    {
        public required Guid ProjectId { get; init; }
        public required Guid ProjectVersionId { get; init; }
        public required Guid UserId { get; init; }
        public required string Name { get; init; }
        public required IFormFile File { get; init; }
    }

    public sealed class ImportRawLLMDataRequestValidator : AbstractValidator<ImportRawLLMOutputRequest>
    {
        public ImportRawLLMDataRequestValidator()
        {
            RuleFor(x => x.ProjectVersionId).NotEmpty();
            RuleFor(x => x.Name)
                .NotEmpty();
            RuleFor(x => x.File)
                .NotEmpty();
        }
    }
}
