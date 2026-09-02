using FluentValidation.Results;

namespace Api.Extensions;

public static class ValidationResultExtensions
{
    public static IReadOnlyDictionary<string, string[]> ToValidationDictionary(this ValidationResult validationResult)
    {
        return validationResult
            .Errors.GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
    }
}
