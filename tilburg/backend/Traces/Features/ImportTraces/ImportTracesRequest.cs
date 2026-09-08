using FluentValidation;
using Mediator;
using Microsoft.AspNetCore.Http;
using Shared;
using Traces.Data.Models;

namespace Traces.Features.ImportTraces;

public record ImportTracesRequest : IRequest<Result<ImportTracesResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }
    public required string Name { get; init; }
    public required IFormFile File { get; init; }
}

public sealed class ImportTracesRequestValidator : AbstractValidator<ImportTracesRequest>
{
    public ImportTracesRequestValidator()
    {
        RuleFor(x => x.ProjectVersionId).NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(TraceCollection.MinNameLength)
            .MaximumLength(TraceCollection.MaxNameLength);

        const long maxFileSize = 500 * 1024 * 1024;
        RuleFor(x => x.File)
            .NotEmpty()
            .Must(file => file.Length <= maxFileSize)
            .WithMessage($"File size cannot exceed {maxFileSize / (1024 * 1024)}MB");
    }
}
