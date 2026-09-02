namespace Shared;

public static class Result
{
    public static Result<TValue> Error<TValue>(ErrorCode errorCode) => new(errorCode);

    public static Result<TValue> Error<TValue>(ErrorCode errorCode, object errorObject) => new(errorCode, errorObject);

    public static Result<TValue> Success<TValue>(TValue value) => new(value);
}

public class Result<TValue>
{
    public bool IsError => ErrorCode != null;

    public bool IsSuccess => ErrorCode == null;

    public ErrorCode? ErrorCode { get; }

    public TValue Value { get; }

    public object ErrorValue { get; }

    public TError ErrorValueAs<TError>()
    {
        if (!IsError)
        {
            throw new NotSupportedException("Cannot get error value from a success result");
        }

        return ErrorValue is TError errorValue
            ? errorValue
            : throw new InvalidCastException($"Cannot cast {ErrorValue.GetType()} to {typeof(TError)}");
    }

    public TResult Match<TResult>(Func<TValue, TResult> onSuccess, Func<ErrorCode, TResult> onError)
    {
        return IsError ? onError(ErrorCode.Value) : onSuccess(Value);
    }

    internal Result(ErrorCode errorCode)
    {
        ErrorCode = errorCode;
    }

    internal Result(ErrorCode errorCode, object errorValue)
    {
        ErrorCode = errorCode;
        ErrorValue = errorValue;
    }

    internal Result(TValue value)
    {
        Value = value;
    }

    public static implicit operator Result<TValue>(ErrorCode errorCode)
    {
        return new Result<TValue>(errorCode);
    }

    public static implicit operator Result<TValue>((ErrorCode ErrorCode, object ErrorValue) errorTuple)
    {
        return new Result<TValue>(errorTuple.ErrorCode, errorTuple.ErrorValue);
    }

    public static implicit operator Result<TValue>(TValue value)
    {
        return new Result<TValue>(value);
    }
}
