using FluentValidation;
using FluentValidation.Results;
using Mediator;

namespace Shared.Middleware;

public class FeatureRequestValidatorBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IMessage
{
    private static readonly List<Type> Types = AppDomain
        .CurrentDomain.GetAssemblies()
        .SelectMany(x => x.GetTypes().Where(y => y.IsAssignableTo(typeof(IValidator))))
        .ToList();

    private readonly IServiceProvider _serviceProvider;

    public FeatureRequestValidatorBehavior(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async ValueTask<TResponse> Handle(
        TRequest message,
        MessageHandlerDelegate<TRequest, TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var requestType = message.GetType();

        // Retrieve request as IRequest<TResponse>
        var requestInterface = requestType
            .GetInterfaces()
            .FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IRequest<>));

        if (requestInterface is null)
        {
            // Request doesn't inherit IRequest<> -> go to handler
            return await next(message, cancellationToken);
        }

        // Retrieve validator type for request type
        var validatorType = typeof(IValidator<>).MakeGenericType(requestType);
        if (Types.All(validatorType.IsAssignableFrom))
        {
            // No validator registered for this request type -> go to handler
            return await next(message, cancellationToken);
        }

        // Get instance of validator type via DI
        var validator = _serviceProvider.GetService(validatorType);
        if (validator is null)
        {
            // No instance available for validator type in DI -> go to handler
            return await next(message, cancellationToken);
        }

        // Invoke ValidateAsync on validator
        var validationResult = await InvokeValidator(validator, requestType, message, cancellationToken);
        if (validationResult is null || validationResult.IsValid)
        {
            // Couldn't validate or request is valid -> go to handler
            return await next(message, cancellationToken);
        }

        // Find static method of Result to create an error result
        var method = typeof(Result)
            .GetMethods()
            .Single(m => m is { Name: "Error", IsGenericMethodDefinition: true } && m.GetParameters().Length == 2);

        var requestResponseType = requestInterface.GetGenericArguments()[0];
        var resultResponseType = requestResponseType.GetGenericArguments()[0];
        var genericMethod = method.MakeGenericMethod(resultResponseType);

        // Create error result
        var result = genericMethod.Invoke(null, [ErrorCode.ValidationError, validationResult]);

        // Return error result
        return (TResponse)result!;
    }

    private static async ValueTask<ValidationResult?> InvokeValidator(
        object validator,
        Type toValidateType,
        object toValidateObject,
        CancellationToken cancellationToken
    )
    {
        var methodInfo = validator
            .GetType()
            .GetMethod(nameof(IValidator<object>.ValidateAsync), [toValidateType, typeof(CancellationToken)]);

        if (methodInfo?.Invoke(validator, [toValidateObject, cancellationToken]) is not Task<ValidationResult> task)
        {
            // Result of ValidateAsync was not Task<ValidationResult> -> return null
            return null;
        }

        // Retrieve validation result
        var validationResult = await task;
        return validationResult;
    }
}
