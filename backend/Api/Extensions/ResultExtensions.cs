using FluentValidation.Results;
using Google.Protobuf.WellKnownTypes;
using Shared;

namespace Api.Extensions;

public static class ResultExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result)
    {
        return result.Match<IResult>(
            value =>
            {
                var isEmpty =
                    typeof(T) == typeof(Empty)
                    || (
                        typeof(T).IsClass && typeof(T).GetProperties().Length == 0 && typeof(T).GetFields().Length == 0
                    );

                return isEmpty ? TypedResults.NoContent() : TypedResults.Ok(value);
            },
            error =>
                error switch
                {
                    ErrorCode.ValidationError => TypedResults.ValidationProblem(
                        result.ErrorValueAs<ValidationResult>().ToValidationDictionary()
                    ),
                    ErrorCode.EntityNotFound => TypedResults.NotFound(),
                    ErrorCode.NoPermission => TypedResults.StatusCode(403),
                    ErrorCode.DatabaseError => TypedResults.InternalServerError(),
                    ErrorCode.NoChanges => TypedResults.Conflict(),
                    ErrorCode.Unauthorized => TypedResults.Unauthorized(),
                    ErrorCode.FileReadError => TypedResults.BadRequest("Could not read the uploaded file"),
                    ErrorCode.InvalidRequest => TypedResults.BadRequest("Request is invalid"),
                    ErrorCode.UnsupportedFileType => TypedResults.BadRequest("File type is not supported"),
                    ErrorCode.LlmError => TypedResults.InternalServerError(),
                    ErrorCode.ProjectVersionNameAlreadyExists => TypedResults.Conflict(),
                    ErrorCode.NoOpenCodes => TypedResults.BadRequest("No open codes available for axial coding"),
                    ErrorCode.LlmConfigError => TypedResults.BadRequest("Llm config is invalid"),
                    _ => TypedResults.InternalServerError(),
                }
        );
    }
}
