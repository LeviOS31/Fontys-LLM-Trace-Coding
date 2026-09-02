using System;
using FluentValidation;
using Mediator;
using Shared;

namespace Projects.Features.GetAllProjects;

public record GetAllProjectsQuery : IRequest<Result<GetAllProjectsResponse>>
{
    public Guid UserId { get; init; }
}

public sealed class GetAllProjectsQueryValidator : AbstractValidator<GetAllProjectsQuery>
{
    public GetAllProjectsQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}
